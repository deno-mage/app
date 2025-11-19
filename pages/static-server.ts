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

  // Pre-load 404.html at startup to avoid blocking on 404 errors
  const notFoundPath = join(rootDir, "404.html");
  let notFoundHtml: string | null = null;
  try {
    notFoundHtml = Deno.readTextFileSync(notFoundPath);
  } catch {
    // 404.html doesn't exist, will use default notFound
  }

  // Wrap serveFiles to handle custom 404 page
  app.get(`${baseRoute}*`, async (c, next) => {
    // Store the original notFound function
    const originalNotFound = c.notFound.bind(c);

    // Override notFound to serve custom 404.html
    c.notFound = (text?: string) => {
      if (notFoundHtml) {
        c.html(notFoundHtml, 404);
      } else {
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
