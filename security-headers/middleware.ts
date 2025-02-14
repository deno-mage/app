import type { MageMiddleware } from "../app/mod.ts";
import { useCSP } from "../csp/mod.ts";

/**
 * Adds security headers to the response to help protect against common web
 * vulnerabilities.
 *
 * @returns MageMiddleware
 */
export const useSecurityHeaders = (): MageMiddleware[] => {
  return [
    useCSP(),
    async (c, next) => {
      c.res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
      c.res.headers.set(
        "Cross-Origin-Resource-Policy",
        "same-origin",
      );
      c.res.headers.set("Origin-Agent-Cluster", "?1");
      c.res.headers.set("Referrer-Policy", "no-referrer");
      c.res.headers.set(
        "Strict-Transport-Security",
        "max-age=15552000; includeSubDomains",
      );
      c.res.headers.set("X-Content-Type-Options", "nosniff");
      c.res.headers.set("X-DNS-Prefetch-Control", "off");
      c.res.headers.set("X-Download-Options", "noopen");
      c.res.headers.set("X-Frame-Options", "SAMEORIGIN");
      c.res.headers.set("X-Permitted-Cross-Domain-Policies", "none");
      c.res.headers.set("X-XSS-Protection", "0");
      c.res.headers.delete("X-Powered-By");

      await next();
    },
  ];
};
