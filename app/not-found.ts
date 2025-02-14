import type { MageMiddleware } from "./router.ts";

/**
 * Responds with a 404 Not Found status code. This middleware
 * will ignore OPTIONS requests.
 *
 * @returns MageMiddleware
 */
export const useNotFound = (): MageMiddleware => {
  return async (c, next) => {
    if (c.req.method === "OPTIONS") {
      // If the request is an OPTIONS request then don't respond with a 405
      await next();
      return;
    }

    c.notFound();
  };
};
