import { HttpMethod } from "../http.ts";
import { MageMiddleware } from "../router.ts";

/**
 * Responds with a 404 Not Found status code if no route matches the request
 * method and URL. This middleware will ignore OPTIONS requests.
 *
 * @returns MageMiddleware
 */
export const useNotFound = (): MageMiddleware => {
  return async (context, next) => {
    await next();

    if (
      !context.matchedRoutename &&
      // TODO - figure out how to get rid of this... only applying the options
      // middle on the OPTIONS method would solve this...
      context.request.method !== HttpMethod.Options
    ) {
      context.notFound();
    }
  };
};
