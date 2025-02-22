import type { MageMiddleware } from "./router.ts";

/**
 * Options for the options middleware.
 */
interface OptionsOptions {
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
export const options = (options: OptionsOptions): MageMiddleware => {
  return async (c, next) => {
    c.empty();

    c.header(
      "Allow",
      options.getAllowedMethods().join(", "),
    );

    await next();
  };
};
