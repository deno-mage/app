import type { MageMiddleware } from "@mage/app";
import { createCacheControlHeader } from "@mage/headers";
import type { CreateCacheControlHeaderOptions } from "@mage/headers";

export interface UseCacheControlOptions
  extends CreateCacheControlHeaderOptions {}

/**
 * Apply a Cache-Control header based on the provided options.
 *
 * @param options
 * @returns MageMiddleware
 */
export const useCacheControl = (
  options: UseCacheControlOptions,
): MageMiddleware => {
  return async (context, next) => {
    context.response.headers.set(
      "Cache-Control",
      createCacheControlHeader(options),
    );

    await next();
  };
};
