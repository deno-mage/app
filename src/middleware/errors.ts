import { MageMiddleware } from "../router.ts";
import { StatusCode, StatusText } from "../http.ts";

/**
 * Wraps downstream middleware in a try/catch block to catch any errors that
 * may occur during the request/response cycle. If an error is caught, the
 * middleware will log the error to the console and respond with a 500 Internal
 * Server Error status code.
 *
 * @returns MageMiddleware
 */
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
