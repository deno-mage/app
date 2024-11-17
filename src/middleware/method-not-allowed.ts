import { HttpMethod, StatusCode, StatusText } from "../http.ts";
import { MageMiddleware } from "../router.ts";

/**
 * Options for the useMethodNotAllowed middleware.
 */
interface UseMethodNotAllowedOptions {
  /**
   * Function to return methods that are allowed for the requested
   * pathname.
   */
  getAllowedMethods: () => string[];
}

/**
 * Responds with a 405 Method Not Allowed status code. This middleware
 * will ignore OPTIONS requests.
 *
 * @returns MageMiddleware
 */
export const useMethodNotAllowed = (
  options: UseMethodNotAllowedOptions,
): MageMiddleware => {
  return async (context, next) => {
    if (context.request.method === HttpMethod.Options) {
      // If the request is an OPTIONS request then don't respond with a 405
      await next();
      return;
    }

    context.text(StatusCode.MethodNotAllowed, StatusText.MethodNotAllowed);

    context.response.headers.set(
      "Allow",
      options.getAllowedMethods().join(", "),
    );
  };
};
