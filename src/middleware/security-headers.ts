import { MageMiddlewareFunction } from "../middleware.ts";

export const useSecurityHeaders = (): MageMiddlewareFunction => {
  return (context) => {
    context.headers.set(
      "Content-Security-Policy",
      "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"
    );
    context.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    context.headers.set("Cross-Origin-Resource-Policy", "same-origin");
    context.headers.set("Origin-Agent-Cluster", "?1");
    context.headers.set("Referrer-Policy", "no-referrer");
    context.headers.set(
      "Strict-Transport-Security",
      "max-age=15552000; includeSubDomains"
    );
    context.headers.set("X-Content-Type-Options", "nosniff");
    context.headers.set("X-DNS-Prefetch-Control", "off");
    context.headers.set("X-Download-Options", "noopen");
    context.headers.set("X-Frame-Options", "SAMEORIGIN");
    context.headers.set("X-Permitted-Cross-Domain-Policies", "none");
    context.headers.set("X-XSS-Protection", "0");
    context.headers.delete("X-Powered-By");
  };
};
