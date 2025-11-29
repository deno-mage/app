/**
 * Static server for pages-next module.
 *
 * Serves pre-built static files from dist directory.
 *
 * @module
 */

import { join } from "@std/path";
import type { MageApp } from "../app/mod.ts";
import { serveFiles } from "../serve-files/mod.ts";
import type { StaticServerOptions } from "./types.ts";

/**
 * Normalizes a base path to ensure it has a trailing slash.
 *
 * This ensures consistent URL building across the application.
 * Root path "/" is a special case that remains unchanged.
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
 * Registers static server routes for pre-built files.
 *
 * Behavior:
 * - Serves pre-built HTML files from dist/
 * - Serves hashed assets from dist/__public/
 * - Falls back to _not-found.html if it exists
 * - No building, watching, or rendering
 * - Production serving mode
 *
 * Uses the serveFiles middleware for all file serving.
 *
 * @param app Mage application instance
 * @param options Static server configuration
 */
export function registerStaticServer(
  app: MageApp,
  options: StaticServerOptions = {},
): void {
  const rootDir = options.rootDir ?? "./";
  const basePath = normalizeBasePath(options.basePath ?? "/");

  // Pre-load _not-found.html at startup to avoid blocking on 404 errors
  const notFoundPath = join(rootDir, "_not-found.html");
  let notFoundHtml: string | null = null;
  try {
    notFoundHtml = Deno.readTextFileSync(notFoundPath);
  } catch {
    // _not-found.html doesn't exist, will use default notFound
  }

  app.get(
    `${basePath}*`,
    serveFiles({
      directory: rootDir,
      serveIndex: true,
      onNotFound: (c) => {
        if (notFoundHtml) {
          c.html(notFoundHtml, 404);
        } else {
          c.notFound();
        }
      },
    }),
  );
}
