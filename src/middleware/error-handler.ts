import { MageMiddleware } from "../router.ts";
import { StatusCode } from "../http.ts";

export const useErrorHandler = (): MageMiddleware => {
  return async (context, next) => {
    try {
      await next();
    } catch (error) {
      console.error(error);
      context.text(StatusCode.InternalServerError, "Internal Server Error");
    }
  };
};
