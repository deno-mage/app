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
    const filepath = resolve(options.directory, c.req.wildcard);

    // Ensure the resolved path is within the allowed directory (prevent path traversal)
    const normalizedBase = resolve(options.directory);
    const normalizedPath = resolve(filepath);
    if (!normalizedPath.startsWith(normalizedBase)) {
      c.notFound();
      return;
    }

    // Try to find a file to serve with the following priority:
    // 1. Exact match
    // 2. Directory with index.html (if serveIndex enabled)
    // 3. File with .html extension appended

    // Check if exact file exists
    if (await exists(filepath, { isFile: true })) {
      await c.file(filepath);
      return;
    }

    // Check if it's a directory with index.html
    if (serveIndex) {
      const directoryExists = await exists(filepath, { isDirectory: true });
      if (directoryExists) {
        const indexPath = resolve(filepath, "index.html");
        if (await exists(indexPath, { isFile: true })) {
          await c.file(indexPath);
          return;
        }
      }
    }

    // Check if file exists with .html extension
    const htmlPath = `${normalizedPath}.html`;
    if (htmlPath.startsWith(normalizedBase)) {
      if (await exists(htmlPath, { isFile: true })) {
        await c.file(htmlPath);
        return;
      }
    }

    // If no file found, return a 404.
    c.notFound();
  };
};
