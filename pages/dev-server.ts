/**
 * Development server for pages module with hot reload.
 *
 * @module
 */

import { join, relative } from "@std/path";
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

/**
 * State for the dev server.
 */
interface DevServerState {
  /** Asset map rebuilt on asset changes */
  assetMap: Map<string, string>;
  /** Watcher abort controllers */
  watchers: AbortController[];
}

/**
 * Registers development server routes with hot reload.
 *
 * Behavior:
 * - Watches pages/, layouts/, and public/ for changes
 * - Rebuilds asset map when public/ changes
 * - Renders pages on-demand from disk
 * - Serves assets from public/ with hashed URLs
 * - Triggers page reload on file changes
 *
 * @param app Mage application instance
 * @param options Dev server configuration
 * @returns Cleanup function to stop watchers
 */
export function registerDevServer(
  app: MageApp,
  options: DevServerOptions = {},
): () => void {
  const rootDir = options.rootDir ?? "./";
  const baseRoute = options.route ?? "/";

  const pagesDir = join(rootDir, "pages");
  const layoutsDir = join(rootDir, "layouts");
  const publicDir = join(rootDir, "public");

  // Initialize dev server state
  const state: DevServerState = {
    assetMap: new Map(),
    watchers: [],
  };

  // Build initial asset map
  buildAssetMap(publicDir, baseRoute).then((map) => {
    state.assetMap = map;
  });

  // Watch directories for changes
  const watchCallback = async (path: string, kind: Deno.FsEvent["kind"]) => {
    // Show path relative to rootDir for cleaner logs
    const relativePath = relative(rootDir, path);
    logger.info(`${kind}: ${relativePath}`);

    // Rebuild asset map if public/ changed
    if (path.startsWith(publicDir)) {
      state.assetMap = await buildAssetMap(publicDir, baseRoute);
    }

    // Notify WebSocket clients to reload
    notifyClients();
  };

  state.watchers = watchDirectories(
    [pagesDir, layoutsDir, publicDir],
    watchCallback,
  );

  // Register routes for pages
  app.get(`${baseRoute}*`, async (c) => {
    let urlPath = c.req.url.pathname.replace(baseRoute, "");
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
        const rendered = await renderPageFromFile(
          notFoundPath,
          rootDir,
          state.assetMap,
        );

        // Inject hot reload script
        const reloadEndpoint = `${baseRoute}__reload`;
        const htmlWithReload = injectHotReload(rendered.html, reloadEndpoint);

        c.html(htmlWithReload, 404);
        return;
      } catch {
        // Fall back to simple 404 if _not-found.md doesn't exist or fails to render
        const reloadEndpoint = `${baseRoute}__reload`;
        const fallbackHtml =
          `<html><body><h1>404 Not Found</h1><p>Page not found: ${urlPath}</p></body></html>`;
        const htmlWithReload = injectHotReload(fallbackHtml, reloadEndpoint);
        c.html(htmlWithReload, 404);
        return;
      }
    }

    // Render page on-demand
    try {
      const rendered = await renderPageFromFile(
        page.filePath,
        rootDir,
        state.assetMap,
      );

      // Inject hot reload script
      const reloadEndpoint = `${baseRoute}__reload`;
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
        const rendered = await renderPageFromFile(
          errorPath,
          rootDir,
          state.assetMap,
        );

        // Inject hot reload script
        const reloadEndpoint = `${baseRoute}__reload`;
        const htmlWithReload = injectHotReload(rendered.html, reloadEndpoint);

        c.html(htmlWithReload, 500);
        return;
      } catch {
        // Fall back to simple error page if _error.md doesn't exist or fails to render
        const message = error instanceof Error
          ? error.message
          : "Unknown error";
        const reloadEndpoint = `${baseRoute}__reload`;
        const fallbackHtml =
          `<html><body><h1>Error rendering page</h1><pre>${message}</pre></body></html>`;
        const htmlWithReload = injectHotReload(fallbackHtml, reloadEndpoint);
        c.html(htmlWithReload, 500);
        return;
      }
    }
  });

  // Register hot reload WebSocket endpoint
  app.get(`${baseRoute}__reload`, (c) => {
    c.webSocket((socket) => {
      registerHotReloadClient(socket);
    });
  });

  // Register routes for assets
  app.get(`${baseRoute}__public/*`, async (c) => {
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
  };
}
