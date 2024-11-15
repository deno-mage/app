import { MageMiddlewareFunction } from "../middleware.ts";
import { StatusCode } from "../status-codes.ts";

export const useNotFoundHandler = (): MageMiddlewareFunction => {
  return async (context, next) => {
    await next();

    if (!context.response) {
      context.text(StatusCode.NotFound, "Not Found");
    }
  };
};
