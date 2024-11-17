import { HttpMethod } from "../http.ts";
import { MageMiddleware } from "../router.ts";

export const useNotFound = (): MageMiddleware => {
  return async (context, next) => {
    await next();

    if (
      !context.matchedPathname &&
      context.request.method !== HttpMethod.Options
    ) {
      context.notFound();
    }
  };
};
