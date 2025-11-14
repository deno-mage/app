import type { MageMiddleware } from "./router.ts";

/**
 * Options for the useMethodNotAllowed middleware.
 */
interface MethodNotAllowedOptions {
  /** Function to return allowed methods for the requested pathname */
  getAllowedMethods: () => string[];
}

/**
 * Respond with 405 Method Not Allowed.
 * Ignores OPTIONS requests (handled by options middleware).
 */
export const methodNotAllowed = (
  options: MethodNotAllowedOptions,
): MageMiddleware => {
  return async (c, next) => {
    if (c.req.method === "OPTIONS") {
      // If the request is an OPTIONS request then don't respond with a 405
      await next();
      return;
    }

    c.text("Method Not Allowed", 405);

    c.header(
      "Allow",
      options.getAllowedMethods().join(", "),
    );
  };
};
