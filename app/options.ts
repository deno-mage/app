import type { MageMiddleware } from "./router.ts";

/**
 * Options for the useOptions middleware.
 */
interface UseOptionsOptions {
  /**
   * Function to return methods that are allowed for the requested
   * pathname.
   */
  getAllowedMethods: () => string[];
}

/**
 * Non-CORS handling of preflight (OPTIONS) requests. Responds with
 * an Allow header containing the available methods for the requested
 * pathname.
 *
 * @param options The options for the OPTIONS middleware.
 * @returns MageMiddleware
 */
export const useOptions = (options: UseOptionsOptions): MageMiddleware => {
  return async (context, next) => {
    context.empty();

    context.res.headers.set(
      "Allow",
      options.getAllowedMethods().join(", "),
    );

    await next();
  };
};
