import { exists } from "@std/fs";
import { resolve } from "@std/path";
import type { MageMiddleware } from "../app/mod.ts";
import { MageError } from "../app/mod.ts";
import { statusText } from "../status/mod.ts";

/**
 * Options for the useServeFiles middleware.
 */
interface ServeFilesOptions {
  /**
   * The directory to serve files from.
   */
  directory: string;
  /**
   * Whether to try and serve index.html when the path is a directory.
   *
   * @default: true
   */
  serveIndex?: boolean;
}

/**
 * Serve a file from a wildcard route. If this middleware is used on a route
 * without a wildcard, it will throw an error. This middleware only serves on
 * GET requests.
 *
 * @returns MageMiddleware
 */
export const serveFiles = (
  options: ServeFilesOptions,
): MageMiddleware => {
  return async (c) => {
    // Do not serve on non-GET requests.
    if (c.req.method !== "GET") {
      c.text(statusText(405), 405);
      return;
    }

    if (typeof c.req.wildcard !== "string") {
      throw new MageError("No wildcard found in c.");
    }

    const serveIndex = options.serveIndex ?? true;

    // Resolve filepath
    let filepath = resolve(options.directory, c.req.wildcard);

    // Ensure the resolved path is within the allowed directory (prevent path traversal)
    const normalizedBase = resolve(options.directory);
    const normalizedPath = resolve(filepath);
    if (!normalizedPath.startsWith(normalizedBase)) {
      c.notFound();
      return;
    }

    // If the requested path is a directory, check if we should serve
    // index.html and update the filepath accordingly.
    const directoryExists = await exists(filepath, { isDirectory: true });
    if (directoryExists && serveIndex) {
      filepath = resolve(filepath, "index.html");
    }

    // If the file exists serve it
    const fileExists = await exists(filepath, { isFile: true });

    if (fileExists) {
      await c.file(filepath);
      return;
    }

    // If the file does not exist, return a 404.
    c.notFound();
  };
};
