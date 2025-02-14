import { exists } from "@std/fs";
import { resolve } from "@std/path";
import type { MageMiddleware } from "../app/mod.ts";
import { MageError } from "../app/mod.ts";
import { statusText } from "../status/mod.ts";

/**
 * Options for the useServeFiles middleware.
 */
interface UseServeFilesOptions {
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
 * It the filepath contains the build id then it wil be stripped from the pathwhen seeking the file in the directory.
 *
 * @returns MageMiddleware
 */
export const useServeFiles = (
  options: UseServeFilesOptions,
): MageMiddleware => {
  return async (c, next) => {
    if (typeof c.req.wildcard !== "string") {
      throw new MageError("No wildcard found in context.");
    }

    // Do not serve on non-GET requests.
    if (c.req.method !== "GET") {
      c.text(statusText(405), 405);
      await next();
      return;
    }

    const serveIndex = options.serveIndex ?? true;

    // Set long cache headers for static files that are cache busted with buildId
    const cacheBustWithBuildId = c.req.wildcard.includes(c.buildId);
    if (cacheBustWithBuildId) {
      c.res.headers.set(
        "Cache-Control",
        "public, max-age=31536000, immutable",
      );
    }

    // Resolve filepath and remove the buildId from the path if it exists
    let filepath = resolve(options.directory, c.req.wildcard).replace(
      `-${c.buildId}`,
      "",
    );

    // If the requested path is a directory, check if we should serve
    // index.html and update the filepath accordingly.
    const directoryExists = await exists(filepath, { isDirectory: true });
    if (directoryExists && serveIndex) {
      filepath = resolve(filepath, "index.html");
    }

    // If the file exists serve it
    const fileExists = await exists(filepath, { isFile: true });

    if (fileExists) {
      await c.serveFile(filepath);
      await next();
      return;
    }

    // If the file does not exist, return a 404.
    c.notFound();

    await next();
  };
};
