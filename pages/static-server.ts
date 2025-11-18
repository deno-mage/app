/**
 * Static server for pages module.
 *
 * Serves pre-built static files from dist directory.
 *
 * @module
 */

import type { MageApp } from "../app/mod.ts";
import { serveFiles } from "../serve-files/mod.ts";
import type { StaticServerOptions } from "./types.ts";

/**
 * Registers static server routes for pre-built files.
 *
 * Behavior:
 * - Serves pre-built HTML files from dist/
 * - Serves hashed assets from dist/__public/
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
  const baseRoute = options.route ?? "/";

  // Everything (pages and assets) is served under the base route
  app.get(
    `${baseRoute}*`,
    serveFiles({
      directory: rootDir,
      serveIndex: true,
    }),
  );
}
