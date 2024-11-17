import { MageMiddleware } from "../router.ts";
import { StatusCode, StatusText } from "../http.ts";

export const useErrors = (): MageMiddleware => {
  return async (context, next) => {
    try {
      await next();
    } catch (error) {
      console.error(error);
      context.text(
        StatusCode.InternalServerError,
        StatusText.InternalServerError,
      );
    }
  };
};
