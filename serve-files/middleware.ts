import { resolve } from "@std/path";
import type { MageContext, MageMiddleware } from "../app/mod.ts";
import { MageError } from "../app/mod.ts";
import { statusText } from "../status/mod.ts";

/**
 * Handler called when a file is not found.
 */
type NotFoundHandler = (c: MageContext) => void | Promise<void>;

/**
 * Options for the useServeFiles middleware.
 */
interface ServeFilesOptions {
  /** Directory to serve files from */
  directory: string;
  /** Serve index.html for directory paths @default true */
  serveIndex?: boolean;
  /** Custom handler for not found responses. If not provided, calls c.notFound() */
  onNotFound?: NotFoundHandler;
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

    // Helper to handle not found - uses custom handler if provided
    const handleNotFound = async () => {
      if (options.onNotFound) {
        await options.onNotFound(c);
      } else {
        c.notFound();
      }
    };

    // Resolve filepath
    const filepath = resolve(options.directory, c.req.wildcard);

    // Ensure the resolved path is within the allowed directory (prevent path traversal)
    const normalizedBase = resolve(options.directory);
    const normalizedPath = resolve(filepath);
    if (!normalizedPath.startsWith(normalizedBase)) {
      await handleNotFound();
      return;
    }

    // Try to find a file to serve with the following priority:
    // 1. Exact match
    // 2. Directory with index.html (if serveIndex enabled)
    // 3. File with .html extension appended

    // Helper to check if path is a file
    const isFile = async (path: string): Promise<boolean> => {
      try {
        const stat = await Deno.stat(path);
        return stat.isFile;
      } catch {
        return false;
      }
    };

    // Helper to check if path is a directory
    const isDirectory = async (path: string): Promise<boolean> => {
      try {
        const stat = await Deno.stat(path);
        return stat.isDirectory;
      } catch {
        return false;
      }
    };

    // Check if exact file exists
    if (await isFile(filepath)) {
      await c.file(filepath);
      return;
    }

    // Check if it's a directory with index.html
    if (serveIndex && await isDirectory(filepath)) {
      const indexPath = resolve(filepath, "index.html");
      if (await isFile(indexPath)) {
        await c.file(indexPath);
        return;
      }
    }

    // Check if file exists with .html extension
    const htmlPath = `${normalizedPath}.html`;
    if (htmlPath.startsWith(normalizedBase) && await isFile(htmlPath)) {
      await c.file(htmlPath);
      return;
    }

    // If no file found, handle not found
    await handleNotFound();
  };
};
