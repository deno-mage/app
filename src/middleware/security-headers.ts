import type { MageMiddleware } from "../router.ts";
import { contentSecurityPolicy } from "../headers/content-security-policy.ts";

/**
 * Adds security headers to the response to help protect against common web
 * vulnerabilities.
 *
 * @returns MageMiddleware
 */
export const useSecurityHeaders = (): MageMiddleware => {
  return async (context, next) => {
    contentSecurityPolicy(context, {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
        upgradeInsecureRequests: true,
      },
    });

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
