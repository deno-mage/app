import { HttpMethod, StatusCode } from "@mage/app";
import type { MageMiddleware } from "@mage/app";

/**
 * Options for the useCORS middleware.
 */
interface UseCORSOptions {
  /**
   * The origins that are allowed to make requests. This can be a single
   * origin or an array of origins. If set to "*", all origins are allowed.
   */
  origins?: "*" | string[];
  /**
   * The methods that are allowed for the requested pathname.
   */
  methods?: "*" | HttpMethod[];
  /**
   * The headers that are allowed for the requested pathname.
   */
  headers?: string[];
  /**
   * The headers that are exposed to the browser.
   */
  exposeHeaders?: string[];
  /**
   * Indicates whether the request can include user credentials like
   * cookies, HTTP authentication or client-side certificates.
   */
  credentials?: boolean;
  /**
   * The amount of seconds the results of a preflight request can be cached
   * in a preflight result cache.
   */
  maxAge?: number;
}

/**
 * Middleware that handles Cross-Origin Resource Sharing (CORS) requests.
 *
 * @param options
 * @returns MageMiddleware
 */
export const useCORS = (options?: UseCORSOptions): MageMiddleware => {
  return async (context, next) => {
    const origin = context.request.header("Origin");

    const allowedOrigins = [options?.origins ?? "*"].flat();
    const allowedMethods = [options?.methods ?? []].flat();
    const allowedHeaders = [options?.headers ?? []].flat();
    const exposeHeaders = [options?.exposeHeaders ?? []].flat();
    const allowCredentials = options?.credentials;
    const allowedMaxAge = options?.maxAge;

    if (allowedOrigins.length > 0) {
      if (allowedOrigins.includes("*")) {
        context.response.headers.set("Access-Control-Allow-Origin", "*");
      }

      if (origin && allowedOrigins.includes(origin)) {
        context.response.headers.set("Access-Control-Allow-Origin", origin);
        context.response.headers.set("Vary", "Origin");
      }
    }

    if (allowedMethods.length > 0) {
      context.response.headers.set(
        "Access-Control-Allow-Methods",
        allowedMethods.join(", "),
      );
    }

    if (allowedHeaders.length > 0) {
      context.response.headers.set(
        "Access-Control-Allow-Headers",
        allowedHeaders.join(", "),
      );
    }

    if (exposeHeaders.length > 0) {
      context.response.headers.set(
        "Access-Control-Expose-Headers",
        exposeHeaders.join(", "),
      );
    }

    if (allowCredentials) {
      context.response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    if (allowedMaxAge) {
      context.response.headers.set(
        "Access-Control-Max-Age",
        allowedMaxAge.toString(),
      );
    }

    if (context.request.method !== HttpMethod.Options) {
      // don't set full CORS headers if the request is not a preflight request
      context.response.headers.delete("Access-Control-Allow-Methods");
      context.response.headers.delete("Access-Control-Allow-Headers");
      context.response.headers.delete("Access-Control-Max-Age");
    }

    context.empty(StatusCode.NoContent);

    await next();
  };
};
