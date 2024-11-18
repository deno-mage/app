import { HttpMethod, StatusCode, StatusText } from "../http.ts";
import type { MageMiddleware } from "../router.ts";

/**
 * Responds with a 404 Not Found status code. This middleware
 * will ignore OPTIONS requests.
 *
 * @returns MageMiddleware
 */
export const useNotFound = (): MageMiddleware => {
  return async (context, next) => {
    if (context.request.method === HttpMethod.Options) {
      // If the request is an OPTIONS request then don't respond with a 405
      await next();
      return;
    }

    context.text(StatusCode.NotFound, StatusText.NotFound);
  };
};
