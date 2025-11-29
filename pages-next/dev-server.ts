/**
 * Development server for pages-next module.
 *
 * Provides on-demand page rendering, hot reload, and dev-time error display.
 *
 * @module
 */

import { join, resolve } from "@std/path";
import type { MageApp, MageMiddleware } from "../app/mod.ts";
import { buildBundle, stopBundleBuilder } from "./bundle-builder.ts";
import { renderErrorOverlay } from "./error-overlay.tsx";
import {
  createFileWatcher,
  type FileChange,
  requiresFullRebuild,
} from "./file-watcher.ts";
import {
  createHotReloadServer,
  type HotReloadServer,
  injectHotReloadScript,
} from "./hot-reload.ts";
import { logger } from "./logger.ts";
import { renderPage } from "./renderer.tsx";
import { getLayoutsForPage, scanSystemFiles } from "./scanner.ts";
import type {
  DevServerOptions,
  MarkdownOptions,
  SystemFiles,
} from "./types.ts";
import {
  checkUnoConfigExists,
  generateCSS,
  loadUnoConfig,
  scanSourceFiles,
} from "./unocss.ts";

/**
 * Maximum number of bundles to keep in cache.
 * This prevents unbounded memory growth during long dev sessions.
 */
const BUNDLE_CACHE_MAX_SIZE = 50;

/**
 * Cache for generated bundles.
 */
interface BundleCache {
  code: string;
  timestamp: number;
}

/**
 * Cache for UnoCSS styles.
 */
interface StylesCache {
  css: string;
  url: string;
  timestamp: number;
  /** Modification time of uno.config.ts when cache was created */
  configMtime: number;
}

/**
 * State for the development server.
 */
interface DevServerState {
  /** Root directory */
  rootDir: string;
  /** Pages directory */
  pagesDir: string;
  /** Public directory */
  publicDir: string;
  /** Base path */
  basePath: string;
  /** Markdown options */
  markdownOptions?: MarkdownOptions;
  /** System files cache */
  systemFiles: SystemFiles | null;
  /** System files cache timestamp */
  systemFilesTimestamp: number;
  /** Bundle cache by page path */
  bundleCache: Map<string, BundleCache>;
  /** UnoCSS styles cache */
  stylesCache: StylesCache | null;
  /** Hot reload server */
  hotReload: HotReloadServer;
  /** Cleanup function for file watcher */
  stopWatcher: (() => void) | null;
}

/**
 * Sets a bundle in the cache with LRU eviction.
 *
 * When cache exceeds max size, removes oldest entries (FIFO).
 */
function setBundleCache(
  cache: Map<string, BundleCache>,
  key: string,
  value: BundleCache,
): void {
  // Delete and re-add to move to end (most recent)
  cache.delete(key);
  cache.set(key, value);

  // Evict oldest entries if over max size
  while (cache.size > BUNDLE_CACHE_MAX_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) {
      cache.delete(firstKey);
    }
  }
}

/**
 * Normalizes a base path to ensure it has a trailing slash.
 */
function normalizeBasePath(basePath: string): string {
  if (basePath === "/") {
    return "/";
  }
  return basePath.endsWith("/") ? basePath : `${basePath}/`;
}

/**
 * Converts a URL path to a page file path.
 *
 * @param urlPath URL path (e.g., "/docs/intro")
 * @param pagesDir Pages directory
 * @returns Potential file paths to try
 */
function urlPathToFilePaths(urlPath: string, pagesDir: string): string[] {
  const paths: string[] = [];

  // Normalize: remove leading slash
  const normalized = urlPath === "/" ? "" : urlPath.slice(1);

  if (normalized === "") {
    // Root path: try index.tsx or index.md
    paths.push(join(pagesDir, "index.tsx"));
    paths.push(join(pagesDir, "index.md"));
  } else {
    // Try as direct file first
    paths.push(join(pagesDir, `${normalized}.tsx`));
    paths.push(join(pagesDir, `${normalized}.md`));
    // Then try as directory index
    paths.push(join(pagesDir, normalized, "index.tsx"));
    paths.push(join(pagesDir, normalized, "index.md"));
  }

  return paths;
}

/**
 * Finds the actual page file for a URL path.
 *
 * Uses lstat to detect symlinks and verifies realPath is within pagesDir
 * to prevent symlink attacks that could read files outside the pages directory.
 */
async function findPageFile(
  urlPath: string,
  pagesDir: string,
): Promise<string | null> {
  const candidates = urlPathToFilePaths(urlPath, pagesDir);
  const resolvedPagesDir = resolve(pagesDir);

  for (const path of candidates) {
    try {
      // Use lstat to detect symlinks
      const stat = await Deno.lstat(path);

      // Reject symlinks for security
      if (stat.isSymlink) {
        continue;
      }

      if (stat.isFile) {
        // Verify the resolved path is still within pagesDir
        const realPath = await Deno.realPath(path);
        if (!realPath.startsWith(resolvedPagesDir)) {
          continue;
        }
        return path;
      }
    } catch {
      // File doesn't exist, try next
    }
  }

  return null;
}

/**
 * Gets the page directory from a file path relative to pages dir.
 */
function getPageDir(filePath: string, pagesDir: string): string {
  const relative = filePath.slice(pagesDir.length + 1);
  const parts = relative.split("/");
  parts.pop(); // Remove filename
  return parts.join("/");
}

/**
 * Gets the page ID from a URL path.
 *
 * Uses `__` as separator to avoid collision between
 * `/a-b` and `/a/b` (both would become "a-b" with `-`).
 */
function urlPathToPageId(urlPath: string): string {
  if (urlPath === "/") {
    return "index";
  }
  return urlPath.slice(1).replace(/\//g, "__");
}

/**
 * Refreshes system files cache if needed.
 */
async function refreshSystemFiles(state: DevServerState): Promise<SystemFiles> {
  // Simple cache: refresh if null
  if (!state.systemFiles) {
    state.systemFiles = await scanSystemFiles(state.pagesDir);
    state.systemFilesTimestamp = Date.now();
  }
  return state.systemFiles;
}

/**
 * Gets the modification time of uno.config.ts.
 */
async function getConfigMtime(rootDir: string): Promise<number> {
  try {
    const configPath = join(rootDir, "uno.config.ts");
    const stat = await Deno.stat(configPath);
    return stat.mtime?.getTime() ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Generates or retrieves cached UnoCSS styles.
 */
async function getStyles(state: DevServerState): Promise<string | undefined> {
  // Check if UnoCSS is enabled
  const configExists = await checkUnoConfigExists(state.rootDir);
  if (!configExists) {
    return undefined;
  }

  // Check config modification time
  const configMtime = await getConfigMtime(state.rootDir);

  // Use cached if available, recent (within 1 second), and config unchanged
  if (
    state.stylesCache &&
    Date.now() - state.stylesCache.timestamp < 1000 &&
    state.stylesCache.configMtime === configMtime
  ) {
    return state.stylesCache.url;
  }

  try {
    const userConfig = await loadUnoConfig(state.rootDir);
    const content = await scanSourceFiles(state.rootDir);
    const result = await generateCSS(content, userConfig, state.basePath);

    state.stylesCache = {
      css: result.css,
      url: `${state.basePath}__dev-styles/uno.css`,
      timestamp: Date.now(),
      configMtime,
    };

    return state.stylesCache.url;
  } catch (error) {
    logger.warn(
      `UnoCSS generation failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return undefined;
  }
}

/**
 * Creates a middleware for serving dev-time generated styles.
 */
function createStylesMiddleware(state: DevServerState): MageMiddleware {
  return (c) => {
    if (!state.stylesCache) {
      c.notFound();
      return;
    }

    c.text(state.stylesCache.css);
    c.header("Content-Type", "text/css");
    c.header("Cache-Control", "no-store");
  };
}

/**
 * Creates a middleware for serving dev-time generated bundles.
 */
function createBundleMiddleware(state: DevServerState): MageMiddleware {
  return (c) => {
    const pageId = c.req.wildcard;
    if (typeof pageId !== "string") {
      c.notFound();
      return;
    }

    // Find bundle in cache
    for (const [path, bundle] of state.bundleCache) {
      const cachedPageId = urlPathToPageId(
        path.includes("pages/")
          ? "/" +
              path
                .split("pages/")[1]
                .replace(/\.(tsx|md)$/, "")
                .replace(/\/index$/, "") || "/"
          : "/",
      );

      if (pageId === `${cachedPageId}.js` || pageId === cachedPageId) {
        c.text(bundle.code);
        c.header("Content-Type", "application/javascript");
        c.header("Cache-Control", "no-store");
        return;
      }
    }

    c.notFound();
  };
}

/**
 * Creates a middleware for serving public assets.
 */
function createPublicMiddleware(state: DevServerState): MageMiddleware {
  return async (c) => {
    const filePath = c.req.wildcard;
    if (typeof filePath !== "string") {
      c.notFound();
      return;
    }

    const fullPath = resolve(state.publicDir, filePath);

    // Path traversal protection
    if (!fullPath.startsWith(resolve(state.publicDir))) {
      c.notFound();
      return;
    }

    try {
      await c.file(fullPath);
    } catch {
      c.notFound();
    }
  };
}

/**
 * Creates a middleware for rendering pages on-demand.
 */
function createPageMiddleware(state: DevServerState): MageMiddleware {
  return async (c) => {
    const url = new URL(c.req.raw.url);
    let urlPath = url.pathname;

    // Strip base path if present
    if (state.basePath !== "/" && urlPath.startsWith(state.basePath)) {
      urlPath = urlPath.slice(state.basePath.length - 1) || "/";
    }

    // Find the page file
    const pagePath = await findPageFile(urlPath, state.pagesDir);

    if (!pagePath) {
      // Try to render not-found page
      const systemFiles = await refreshSystemFiles(state);
      if (systemFiles.notFound) {
        try {
          const stylesheetUrl = await getStyles(state);
          const pageDir = "";
          const layoutInfos = getLayoutsForPage(pageDir, systemFiles.layouts);
          const layoutPaths = layoutInfos.map((l) => l.filePath);
          const pageId = "not-found";

          const bundle = await buildBundle({
            pagePath: systemFiles.notFound,
            layoutPaths,
            rootDir: state.rootDir,
            production: false,
            pageId,
          });

          setBundleCache(state.bundleCache, systemFiles.notFound, {
            code: bundle.code,
            timestamp: Date.now(),
          });

          const bundleUrl = `${state.basePath}__dev-bundles/${pageId}.js`;
          const result = await renderPage({
            pagePath: systemFiles.notFound,
            pagesDir: state.pagesDir,
            systemFiles,
            markdownOptions: state.markdownOptions,
            bundleUrl,
            stylesheetUrl,
          });

          const html = injectHotReloadScript(result.html);
          c.header("Cache-Control", "no-store");
          c.html(html, 404);
          return;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          state.hotReload.sendError(err.message, err.stack);
          const html = renderErrorOverlay(err, systemFiles.notFound);
          c.html(injectHotReloadScript(html), 500);
          return;
        }
      }

      c.notFound();
      return;
    }

    try {
      const systemFiles = await refreshSystemFiles(state);
      const stylesheetUrl = await getStyles(state);

      // Get layouts for this page
      const pageDir = getPageDir(pagePath, state.pagesDir);
      const layoutInfos = getLayoutsForPage(pageDir, systemFiles.layouts);
      const layoutPaths = layoutInfos.map((l) => l.filePath);

      // Build bundle
      const pageId = urlPathToPageId(urlPath);
      const isMarkdown = pagePath.endsWith(".md");

      const bundle = await buildBundle({
        pagePath,
        layoutPaths,
        rootDir: state.rootDir,
        production: false,
        pageId,
        isMarkdown,
      });

      // Cache the bundle with LRU eviction
      setBundleCache(state.bundleCache, pagePath, {
        code: bundle.code,
        timestamp: Date.now(),
      });

      const bundleUrl = `${state.basePath}__dev-bundles/${pageId}.js`;

      // Render page
      const result = await renderPage({
        pagePath,
        pagesDir: state.pagesDir,
        systemFiles,
        markdownOptions: state.markdownOptions,
        bundleUrl,
        stylesheetUrl,
      });

      // Inject hot reload script
      const html = injectHotReloadScript(result.html);

      c.header("Cache-Control", "no-store");
      c.html(html);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      state.hotReload.sendError(err.message, err.stack);
      const html = renderErrorOverlay(err, pagePath);
      c.html(injectHotReloadScript(html), 500);
    }
  };
}

/**
 * Handles file changes and triggers appropriate actions.
 */
function handleFileChanges(state: DevServerState, changes: FileChange[]): void {
  // If layout, system file, or config changed, invalidate all caches
  if (requiresFullRebuild(changes)) {
    state.systemFiles = null;
    state.bundleCache.clear();
    state.stylesCache = null;
  } else {
    // Otherwise, just invalidate affected pages
    for (const change of changes) {
      if (change.type === "page") {
        const fullPath = resolve(state.rootDir, change.relativePath);
        state.bundleCache.delete(fullPath);
      }
    }
  }

  // Trigger reload
  state.hotReload.reload();
}

/**
 * Registers the development server on a MageApp.
 *
 * Provides:
 * - On-demand page rendering
 * - Hot reload via WebSocket
 * - Dev-time error overlay
 * - Public asset serving (unhashed)
 * - UnoCSS generation (if enabled)
 *
 * @param app Mage application instance
 * @param options Dev server configuration
 * @returns Cleanup function to stop watchers and close connections
 */
export async function registerDevServer(
  app: MageApp,
  options: DevServerOptions = {},
): Promise<() => Promise<void>> {
  const rootDir = resolve(options.rootDir ?? "./");
  const basePath = normalizeBasePath(options.basePath ?? "/");
  const pagesDir = resolve(rootDir, "pages");
  const publicDir = resolve(rootDir, "public");

  // Initialize state
  const state: DevServerState = {
    rootDir,
    pagesDir,
    publicDir,
    basePath,
    markdownOptions: options.markdownOptions,
    systemFiles: null,
    systemFilesTimestamp: 0,
    bundleCache: new Map(),
    stylesCache: null,
    hotReload: createHotReloadServer(),
    stopWatcher: null,
  };

  // Pre-scan system files
  state.systemFiles = await scanSystemFiles(pagesDir);

  // Set up file watcher
  state.stopWatcher = createFileWatcher({
    rootDir,
    debounceMs: 100,
    onChange: (changes) => handleFileChanges(state, changes),
  });

  // Register WebSocket endpoint for hot reload
  app.get(`${basePath}__hot-reload`, (c) => {
    state.hotReload.handleUpgrade(c);
  });

  // Register styles endpoint
  app.get(`${basePath}__dev-styles/*`, createStylesMiddleware(state));

  // Register bundles endpoint
  app.get(`${basePath}__dev-bundles/*`, createBundleMiddleware(state));

  // Register public assets endpoint
  app.get(`${basePath}public/*`, createPublicMiddleware(state));

  // Register catch-all page handler
  app.get(`${basePath}*`, createPageMiddleware(state));

  logger.info("Dev server ready");

  // Return cleanup function
  return async () => {
    if (state.stopWatcher) {
      state.stopWatcher();
    }
    state.hotReload.close();
    await stopBundleBuilder();

    // Clear caches to free memory
    state.bundleCache.clear();
    state.stylesCache = null;
    state.systemFiles = null;
  };
}
