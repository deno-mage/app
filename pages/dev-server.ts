/**
 * Development server for pages module with hot reload.
 *
 * @module
 */

import { join, resolve } from "@std/path";
import type { MageApp } from "../app/mod.ts";
import { scanPages } from "./scanner.ts";
import { renderPageFromFile } from "./renderer.ts";
import { buildAssetMap, resolveAssetPath } from "./assets.ts";
import { watchDirectories } from "./watcher.ts";
import {
  injectHotReload,
  notifyClients,
  registerHotReloadClient,
} from "./hot-reload.ts";
import { logger } from "./logger.ts";
import type { DevServerOptions } from "./types.ts";
import { buildBundle, stopBundleBuilder } from "./bundle-builder.ts";
import type { BundleResult } from "./bundle-builder.ts";
import { extractLayoutName } from "./frontmatter-parser.ts";

/**
 * Normalizes a base path to ensure it has a trailing slash.
 *
 * - "/" → "/"
 * - "/docs" → "/docs/"
 * - "/docs/" → "/docs/"
 *
 * @param basePath Base path to normalize
 * @returns Normalized base path with trailing slash
 */
function normalizeBasePath(basePath: string): string {
  if (basePath === "/") {
    return "/";
  }
  return basePath.endsWith("/") ? basePath : `${basePath}/`;
}

/**
 * State for the dev server.
 */
interface DevServerState {
  /** Asset map rebuilt on asset changes */
  assetMap: Map<string, string>;
  /** Watcher abort controllers */
  watchers: AbortController[];
  /** In-memory bundle cache (pageId -> bundle) */
  bundleCache: Map<string, BundleResult>;
}

/**
 * Registers development server routes with hot reload.
 *
 * Behavior:
 * - Watches entire rootDir for changes (pages/, layouts/, components/, public/, etc.)
 * - Rebuilds asset map when public/ changes
 * - Renders pages on-demand from disk
 * - Serves assets from public/ with hashed URLs
 * - Triggers page reload on file changes
 *
 * @param app Mage application instance
 * @param options Dev server configuration
 * @returns Cleanup function to stop watchers
 */
export async function registerDevServer(
  app: MageApp,
  options: DevServerOptions = {},
): Promise<() => void> {
  const rootDir = options.rootDir ?? "./";
  const basePath = normalizeBasePath(options.basePath ?? "/");

  const pagesDir = join(rootDir, "pages");
  const publicDir = join(rootDir, "public");

  // Initialize dev server state
  const state: DevServerState = {
    assetMap: new Map(),
    watchers: [],
    bundleCache: new Map(),
  };

  // Build initial asset map
  state.assetMap = await buildAssetMap(publicDir, basePath);

  // Watch entire rootDir for changes
  const watchCallback = async (path: string) => {
    // Rebuild asset map if public/ changed
    if (path.startsWith(publicDir)) {
      state.assetMap = await buildAssetMap(publicDir, basePath);
    }

    // Clear bundle cache on any file change (layouts, components, etc.)
    state.bundleCache.clear();

    // Notify WebSocket clients to reload
    notifyClients();
  };

  state.watchers = watchDirectories(
    [rootDir],
    watchCallback,
  );

  // Register routes for pages
  app.get(`${basePath}*`, async (c) => {
    let pathname = c.req.url.pathname;

    // Normalize pathname: if it matches basePath without trailing slash, add it
    // This ensures both /docs and /docs/ work when basePath is /docs/
    if (basePath !== "/" && pathname === basePath.slice(0, -1)) {
      pathname = basePath;
    }

    let urlPath = pathname.replace(basePath, "");
    // Ensure urlPath starts with /
    if (!urlPath.startsWith("/")) {
      urlPath = "/" + urlPath;
    }

    // Find matching page
    const pages = await scanPages(pagesDir);
    const page = pages.find((p) => p.urlPath === urlPath);

    if (!page) {
      // Try to render _not-found.md
      const notFoundPath = join(pagesDir, "_not-found.md");
      try {
        const content = await Deno.readTextFile(notFoundPath);
        const layoutName = extractLayoutName(content);

        // Build or retrieve cached bundle for 404 page
        const pageId = "404";
        let bundle = state.bundleCache.get(pageId);

        if (!bundle) {
          const layoutPath = resolve(rootDir, "layouts", `${layoutName}.tsx`);
          bundle = await buildBundle({
            layoutPath,
            rootDir: Deno.cwd(),
            production: false,
            pageId,
          });
          state.bundleCache.set(pageId, bundle);
          logger.info("Built dev bundle for: 404");
        }

        const bundleUrl = `${basePath}__bundles/${pageId}.js`;
        const rendered = await renderPageFromFile(
          notFoundPath,
          rootDir,
          { assetMap: state.assetMap, bundleUrl },
        );

        // Inject hot reload script
        const reloadEndpoint = `${basePath}__reload`;
        const htmlWithReload = injectHotReload(rendered.html, reloadEndpoint);

        c.html(htmlWithReload, 404);
        return;
      } catch {
        // Fall back to simple 404 if _not-found.md doesn't exist or fails to render
        const reloadEndpoint = `${basePath}__reload`;
        const fallbackHtml =
          `<html><body><h1>404 Not Found</h1><p>Page not found: ${urlPath}</p></body></html>`;
        const htmlWithReload = injectHotReload(fallbackHtml, reloadEndpoint);
        c.html(htmlWithReload, 404);
        return;
      }
    }

    // Render page on-demand
    try {
      // Read frontmatter to determine layout
      const content = await Deno.readTextFile(page.filePath);
      const layoutName = extractLayoutName(content);

      // Build or retrieve cached bundle
      const pageId = urlPath === "/"
        ? "index"
        : urlPath.slice(1).replace(/\//g, "-");
      let bundle = state.bundleCache.get(pageId);

      if (!bundle) {
        // Resolve to absolute path for esbuild (handles both absolute and relative rootDir)
        const layoutPath = resolve(rootDir, "layouts", `${layoutName}.tsx`);
        bundle = await buildBundle({
          layoutPath,
          rootDir: Deno.cwd(), // Use project root where deno.json is for import resolution
          production: false, // Dev mode: no minification, with sourcemaps
          pageId,
        });
        state.bundleCache.set(pageId, bundle);
        logger.info(`Built dev bundle for: ${urlPath}`);
      }

      // Render page with bundle URL
      const bundleUrl = `${basePath}__bundles/${pageId}.js`;
      const rendered = await renderPageFromFile(
        page.filePath,
        rootDir,
        { assetMap: state.assetMap, bundleUrl },
      );

      logger.info(`Rendered page: ${urlPath}`);

      // Inject hot reload script
      const reloadEndpoint = `${basePath}__reload`;
      const htmlWithReload = injectHotReload(rendered.html, reloadEndpoint);

      c.html(htmlWithReload);
    } catch (error) {
      // Log the error for debugging
      logger.error(
        error instanceof Error ? error : new Error(String(error)),
      );

      // Try to render _error.md
      const errorPath = join(pagesDir, "_error.md");
      try {
        const content = await Deno.readTextFile(errorPath);
        const layoutName = extractLayoutName(content);

        // Build or retrieve cached bundle for 500 page
        const pageId = "500";
        let bundle = state.bundleCache.get(pageId);

        if (!bundle) {
          const layoutPath = resolve(rootDir, "layouts", `${layoutName}.tsx`);
          bundle = await buildBundle({
            layoutPath,
            rootDir: Deno.cwd(),
            production: false,
            pageId,
          });
          state.bundleCache.set(pageId, bundle);
          logger.info("Built dev bundle for: 500");
        }

        const bundleUrl = `${basePath}__bundles/${pageId}.js`;
        const rendered = await renderPageFromFile(
          errorPath,
          rootDir,
          { assetMap: state.assetMap, bundleUrl },
        );

        // Inject hot reload script
        const reloadEndpoint = `${basePath}__reload`;
        const htmlWithReload = injectHotReload(rendered.html, reloadEndpoint);

        c.html(htmlWithReload, 500);
        return;
      } catch {
        // Fall back to simple error page if _error.md doesn't exist or fails to render
        const message = error instanceof Error
          ? error.message
          : "Unknown error";
        const reloadEndpoint = `${basePath}__reload`;
        const fallbackHtml =
          `<html><body><h1>Error rendering page</h1><pre>${message}</pre></body></html>`;
        const htmlWithReload = injectHotReload(fallbackHtml, reloadEndpoint);
        c.html(htmlWithReload, 500);
        return;
      }
    }
  });

  // Register hot reload WebSocket endpoint
  app.get(`${basePath}__reload`, (c) => {
    c.webSocket((socket) => {
      registerHotReloadClient(socket);
    });
  });

  // Register route for bundles
  app.get(`${basePath}__bundles/*`, (c) => {
    // Extract pageId from path (remove /__bundles/ prefix and .js suffix)
    const path = c.req.url.pathname;
    const bundlesPrefix = `${basePath}__bundles/`;
    const pageId = path
      .slice(bundlesPrefix.length)
      .replace(/\.js$/, "");

    const bundle = state.bundleCache.get(pageId);

    if (!bundle) {
      c.notFound();
      return;
    }

    // Serve bundle with correct content type
    c.text(bundle.code);
    c.header("Content-Type", "application/javascript");
  });

  // Register routes for assets
  app.get(`${basePath}__public/*`, async (c) => {
    const hashedUrl = c.req.url.pathname;

    // Resolve hashed URL to clean file path
    const cleanPath = resolveAssetPath(hashedUrl, state.assetMap);

    if (!cleanPath) {
      c.notFound();
      return;
    }

    const filePath = join(publicDir, cleanPath);

    try {
      await c.file(filePath);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        c.notFound();
      } else {
        throw error;
      }
    }
  });

  // Return cleanup function
  return () => {
    for (const watcher of state.watchers) {
      watcher.abort();
    }
    stopBundleBuilder();
  };
}
