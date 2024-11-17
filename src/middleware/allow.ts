import { MageMiddleware } from "../router.ts";

/**
 * Responds with an Allow header containing the available methods for the
 * requested pathname. This middleware is used to handle preflight (OPTIONS)
 * requests.
 *
 * @returns MageMiddleware
 */
export const useAllow = (): MageMiddleware => {
  return async (context, next) => {
    const methods = context.getAvailableMethods(context.url.pathname);

    context.empty();

    context.response.headers.set("Allow", methods.join(", "));

    await next();
  };
};
