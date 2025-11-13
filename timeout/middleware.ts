import type { MageMiddleware } from "../app/mod.ts";
import { MageError } from "../app/mod.ts";

/**
 * Options for the timeout middleware.
 */
export interface TimeoutOptions {
  /**
   * Maximum request duration in milliseconds.
   * @default 30000 (30 seconds)
   */
  ms?: number;
}

/**
 * Middleware that enforces a maximum request duration. If the request
 * takes longer than the specified timeout, it will be aborted with a
 * 408 Request Timeout response.
 *
 * @param options Configuration options for timeout
 * @returns MageMiddleware
 */
export const timeout = (options?: TimeoutOptions): MageMiddleware => {
  const ms = options?.ms ?? 30000; // 30 seconds default

  if (ms <= 0) {
    throw new MageError(
      "[Timeout middleware] timeout must be a positive number",
    );
  }

  return async (_, next) => {
    let timeoutId: number | undefined;

    // Create timeout promise
    const createTimeoutPromise = (): Promise<never> => {
      return new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new MageError(
              `[Timeout middleware] Request exceeded timeout of ${ms}ms`,
              408,
            ),
          );
        }, ms);
      });
    };

    const timeoutPromise = createTimeoutPromise();

    try {
      // Race between the middleware chain and the timeout
      await Promise.race([next(), timeoutPromise]);
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  };
};
