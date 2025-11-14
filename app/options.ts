import type { MageMiddleware } from "./router.ts";

/**
 * Options for the options middleware.
 */
interface OptionsOptions {
  /** Function to return allowed methods for the requested pathname */
  getAllowedMethods: () => string[];
}

/**
 * Handle OPTIONS requests with Allow header.
 * Non-CORS preflight handling for available methods.
 */
export const options = (options: OptionsOptions): MageMiddleware => {
  return async (c, next) => {
    if (c.req.method === "OPTIONS") {
      c.empty();

      c.header(
        "Allow",
        options.getAllowedMethods().join(", "),
      );
    }

    await next();
  };
};
