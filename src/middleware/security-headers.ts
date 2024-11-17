import { MageMiddleware } from "../router.ts";

/**
 * Adds security headers to the response to help protect against common web
 * vulnerabilities.
 *
 * @returns MageMiddleware
 */
export const useSecurityHeaders = (): MageMiddleware => {
  return async (context, next) => {
    context.response.headers.set(
      "Content-Security-Policy",
      "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
    );
    context.response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    context.response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
    context.response.headers.set("Origin-Agent-Cluster", "?1");
    context.response.headers.set("Referrer-Policy", "no-referrer");
    context.response.headers.set(
      "Strict-Transport-Security",
      "max-age=15552000; includeSubDomains",
    );
    context.response.headers.set("X-Content-Type-Options", "nosniff");
    context.response.headers.set("X-DNS-Prefetch-Control", "off");
    context.response.headers.set("X-Download-Options", "noopen");
    context.response.headers.set("X-Frame-Options", "SAMEORIGIN");
    context.response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
    context.response.headers.set("X-XSS-Protection", "0");
    context.response.headers.delete("X-Powered-By");

    await next();
  };
};
