import { MageMiddleware } from "../router.ts";
import { StatusCode, StatusText } from "../http.ts";

export const useNotFound = (): MageMiddleware => {
  return async (context, next) => {
    if (context.matchedPathname) {
      await next();
    }

    context.text(StatusCode.NotFound, StatusText.NotFound);
  };
};
