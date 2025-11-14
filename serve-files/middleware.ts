import { exists } from "@std/fs";
import { resolve } from "@std/path";
import type { MageMiddleware } from "../app/mod.ts";
import { MageError } from "../app/mod.ts";
import { statusText } from "../status/mod.ts";

/**
 * Options for the useServeFiles middleware.
 */
interface ServeFilesOptions {
  /** Directory to serve files from */
  directory: string;
  /** Serve index.html for directory paths @default true */
  serveIndex?: boolean;
}

/**
 * Serve static files from a wildcard route.
 * Only serves on GET and HEAD requests.
 *
 * @throws MageError if wildcard parameter is not present in request
 */
export const serveFiles = (
  options: ServeFilesOptions,
): MageMiddleware => {
  return async (c) => {
    // Only serve on GET and HEAD requests
    if (c.req.method !== "GET" && c.req.method !== "HEAD") {
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
