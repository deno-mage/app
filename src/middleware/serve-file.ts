import { exists } from "@std/fs";
import { resolve } from "@std/path";
import { HttpMethod, StatusCode, StatusText } from "../http.ts";
import type { MageMiddleware } from "../router.ts";

/**
 * Options for the useServeFile middleware.
 */
interface UseServeFileOptions {
  /**
   * The directory to serve files from.
   */
  directory: string;
  /**
   * Whether to serve index.html when the path is a directory.
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
export const useServeFile = (options: UseServeFileOptions): MageMiddleware => {
  return async (context, next) => {
    if (context.request.method !== HttpMethod.Get) {
      context.text(StatusCode.MethodNotAllowed, StatusText.MethodNotAllowed);
      await next();
      return;
    }

    if (typeof context.wildcard !== "string") {
      context.text(StatusCode.NotFound, StatusText.NotFound);
      await next();
      return;
    }

    let filepath = resolve(options.directory, context.wildcard);
    let fileInfo = await Deno.stat(filepath);

    const serveIndex = options.serveIndex ?? true;
    if (fileInfo.isDirectory && serveIndex) {
      filepath = resolve(filepath, "index.html");
      fileInfo = await Deno.stat(filepath);
    }

    const fileExists = await exists(filepath, { isFile: true });
    if (!fileExists) {
      context.text(StatusCode.NotFound, StatusText.NotFound);
      await next();
      return;
    }

    await context.serveFile(filepath, fileInfo);

    await next();
  };
};
