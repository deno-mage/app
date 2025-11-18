/**
 * Static server for pages module.
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
 * Registers static server routes for pre-built files.
 *
 * Behavior:
 * - Serves pre-built HTML files from dist/
 * - Serves hashed assets from dist/__public/
 * - Falls back to 404.html if it exists
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

  // Wrap serveFiles to handle custom 404 page
  app.get(`${baseRoute}*`, async (c, next) => {
    // Store the original notFound function
    const originalNotFound = c.notFound.bind(c);

    // Override notFound to serve custom 404.html (synchronously)
    c.notFound = (text?: string) => {
      const notFoundPath = join(rootDir, "404.html");
      try {
        // Read file synchronously to maintain sync interface
        const html = Deno.readTextFileSync(notFoundPath);
        c.html(html, 404);
      } catch {
        // Fall back to original notFound if 404.html doesn't exist
        originalNotFound(text);
      }
    };

    // Call serveFiles middleware
    await serveFiles({
      directory: rootDir,
      serveIndex: true,
    })(c, next);
  });
}
