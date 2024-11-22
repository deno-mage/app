import { exists } from "@std/fs";
import { resolve } from "@std/path";
import { HttpMethod, StatusCode, StatusText } from "../http.ts";
import type { MageMiddleware } from "../router.ts";

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
 * Serve a file. This middleware only serves on GET requests.
 *
 * @returns MageMiddleware
 */
export const useServeFiles = (
  options: UseServeFilesOptions,
): MageMiddleware => {
  return async (context, next) => {
    // Do not serve on non-GET requests.
    if (context.request.method !== HttpMethod.Get) {
      context.text(StatusCode.MethodNotAllowed, StatusText.MethodNotAllowed);
      await next();
      return;
    }

    const serveIndex = options.serveIndex ?? true;

    let filepath = resolve(options.directory, context.wildcard ?? "");

    // If the requested path is a directory, check if we should serve
    // index.html and update the filepath accordingly.
    const directoryExists = await exists(filepath, { isDirectory: true });
    if (directoryExists && serveIndex) {
      filepath = resolve(filepath, "index.html");
    }

    // Check the file exists and escape early if it does not sending a 404.
    const fileExists = await exists(filepath, { isFile: true });
    if (!fileExists) {
      context.text(StatusCode.NotFound, StatusText.NotFound);
      await next();
      return;
    }

    // Finally serve the file.
    await context.serveFile(filepath);

    await next();
  };
};
