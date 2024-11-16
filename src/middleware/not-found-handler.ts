import { MageMiddleware } from "../router.ts";
import { StatusCode } from "../http.ts";

export const useNotFoundHandler = (): MageMiddleware => {
  return async (context, next) => {
    await next();

    if (!context.isRouteMatched) {
      context.text(StatusCode.NotFound, "Not Found");
    }
  };
};
