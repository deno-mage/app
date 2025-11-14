import type { MageMiddleware } from "./router.ts";

/**
 * Respond with 404 Not Found.
 * Ignores OPTIONS requests (handled by options middleware).
 */
export const notFound = (): MageMiddleware => {
  return async (c, next) => {
    if (c.req.method === "OPTIONS") {
      // If the request is an OPTIONS request then don't respond with a 405
      await next();
      return;
    }

    c.notFound();
  };
};
