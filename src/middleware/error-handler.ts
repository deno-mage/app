import { MageMiddlewareFunction } from "../middleware.ts";
import { StatusCode } from "../status-codes.ts";

export const useErrorHandler = (): MageMiddlewareFunction => {
  return async (context, next) => {
    try {
      await next();
    } catch (error) {
      console.error(error);
      context.text(StatusCode.InternalServerError, "Internal Server Error");
    }
  };
};
