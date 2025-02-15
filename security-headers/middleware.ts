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
      c.header("Cross-Origin-Opener-Policy", "same-origin");
      c.header(
        "Cross-Origin-Resource-Policy",
        "same-origin",
      );
      c.header("Origin-Agent-Cluster", "?1");
      c.header("Referrer-Policy", "no-referrer");
      c.header(
        "Strict-Transport-Security",
        "max-age=15552000; includeSubDomains",
      );
      c.header("X-Content-Type-Options", "nosniff");
      c.header("X-DNS-Prefetch-Control", "off");
      c.header("X-Download-Options", "noopen");
      c.header("X-Frame-Options", "SAMEORIGIN");
      c.header("X-Permitted-Cross-Domain-Policies", "none");
      c.header("X-XSS-Protection", "0");
      c.res.headers.delete("X-Powered-By");

      await next();
    },
  ];
};
