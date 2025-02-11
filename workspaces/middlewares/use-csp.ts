import type { MageMiddleware } from "@mage/app";
import { createCSPHeader } from "@mage/headers";
import type { CreateCSPHeaderOptions } from "@mage/headers";

/**
 * Options for the useCSP middleware
 */
interface UseCSPOptions extends CreateCSPHeaderOptions {}

/**
 * Apply a Content-Security-Policy header based on the provided options.
 *
 * @param options
 * @returns MageMiddleware
 */
export const useCSP = (options: UseCSPOptions): MageMiddleware => {
  return async (context, next) => {
    context.response.headers.set(
      "Content-Security-Policy",
      createCSPHeader(options),
    );

    await next();
  };
};
