import { MageMiddleware } from "../router.ts";
import { HttpMethod } from "../http.ts";

export const useOptions = (): MageMiddleware => {
  return async (context, next) => {
    if (context.request.method === HttpMethod.Options) {
      const methods = context.getAvailableMethods(context.url.pathname);

      context.empty();

      context.response.headers.set("Allow", methods.join(", "));

      // don't continue with the middleware chain if handling preflight request
      return;
    }

    await next();
  };
};
