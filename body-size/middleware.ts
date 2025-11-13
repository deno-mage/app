import type { MageMiddleware } from "../app/mod.ts";
import { MageError } from "../app/mod.ts";

/**
 * Options for the bodySize middleware.
 */
export interface BodySizeOptions {
  /**
   * Maximum request body size in bytes.
   * @default 1048576 (1MB)
   */
  maxSize?: number;
}

/**
 * Middleware that limits the size of request bodies to prevent memory exhaustion
 * and denial of service attacks.
 *
 * @param options Configuration options for body size limiting
 * @returns MageMiddleware
 */
export const bodySize = (options?: BodySizeOptions): MageMiddleware => {
  const maxSize = options?.maxSize ?? 1048576; // 1MB default

  if (maxSize <= 0) {
    throw new MageError(
      "[Body Size middleware] maxSize must be a positive number",
    );
  }

  return async (c, next) => {
    const contentLength = c.req.header("Content-Length");

    // Fast path: check Content-Length header first
    if (contentLength) {
      const length = parseInt(contentLength, 10);
      if (!isNaN(length) && length > maxSize) {
        throw new MageError(
          `[Body Size middleware] Request body size (${length} bytes) exceeds maximum allowed size (${maxSize} bytes)`,
          413,
        );
      }
    }

    // If no Content-Length header or it passed the check, continue
    // Note: We rely on the body parsing methods to handle actual size validation
    // since we can't easily stream-limit without reimplementing all body parsers
    await next();
  };
};
