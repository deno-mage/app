import type { MageMiddleware } from "../app/mod.ts";
import { MageError } from "../app/mod.ts";

/**
 * Options for the cors middleware.
 */
interface CORSOptions {
  /** Allowed origins ("*" or array of specific origins) */
  origins?: "*" | string[];
  /** Allowed HTTP methods */
  methods?: "*" | string[];
  /** Allowed request headers */
  headers?: string[];
  /** Headers exposed to the browser */
  exposeHeaders?: string[];
  /** Allow credentials (cookies, HTTP auth, client certificates) */
  credentials?: boolean;
  /** Seconds to cache preflight results */
  maxAge?: number;
}

/**
 * Handle Cross-Origin Resource Sharing (CORS) requests.
 *
 * @throws MageError if wildcard origin is used with credentials (CORS spec violation)
 */
export const cors = (options?: CORSOptions): MageMiddleware => {
  return async (c, next) => {
    const origin = c.req.header("Origin");

    const allowedOrigins = [options?.origins ?? "*"].flat();
    const allowedMethods = [options?.methods ?? []].flat();
    const allowedHeaders = [options?.headers ?? []].flat();
    const exposeHeaders = [options?.exposeHeaders ?? []].flat();
    const allowCredentials = options?.credentials;
    const allowedMaxAge = options?.maxAge;

    // Validate: Cannot use wildcard origin with credentials (CORS spec violation)
    if (allowedOrigins.includes("*") && allowCredentials) {
      throw new MageError(
        "Cannot use wildcard origin (*) with credentials. This violates the CORS specification.",
        400,
      );
    }

    // Handle Access-Control-Allow-Origin
    if (allowedOrigins.length > 0) {
      if (allowedOrigins.includes("*")) {
        c.header("Access-Control-Allow-Origin", "*");
      } else if (origin && allowedOrigins.includes(origin)) {
        c.header("Access-Control-Allow-Origin", origin);
        c.header("Vary", "Origin");
      }
    }

    if (allowedMethods.length > 0) {
      c.header(
        "Access-Control-Allow-Methods",
        allowedMethods.join(", "),
      );
    }

    if (allowedHeaders.length > 0) {
      c.header(
        "Access-Control-Allow-Headers",
        allowedHeaders.join(", "),
      );
    }

    if (exposeHeaders.length > 0) {
      c.header(
        "Access-Control-Expose-Headers",
        exposeHeaders.join(", "),
      );
    }

    if (allowCredentials) {
      c.header("Access-Control-Allow-Credentials", "true");
    }

    if (allowedMaxAge) {
      c.header(
        "Access-Control-Max-Age",
        allowedMaxAge.toString(),
      );
    }

    await next();

    // For actual (non-OPTIONS) requests, remove preflight-only headers
    if (c.req.method !== "OPTIONS") {
      c.res.headers.delete("Access-Control-Allow-Methods");
      c.res.headers.delete("Access-Control-Allow-Headers");
      c.res.headers.delete("Access-Control-Max-Age");
    }

    // If no response body was set by subsequent handlers, set empty response
    if (!c.res.hasBody()) {
      c.empty();
    }
  };
};
