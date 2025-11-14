import type { MageMiddleware } from "../app/mod.ts";
import { csp, type CSPOptions } from "../csp/mod.ts";

/**
 * Options for the securityHeaders middleware.
 */
export interface SecurityHeadersOptions {
  /** Content-Security-Policy header options */
  csp?: CSPOptions;
  /** Controls referrer information sent with requests @default "no-referrer" */
  referrerPolicy?:
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url";
  /** Enforce HTTPS for duration @default "max-age=15552000; includeSubDomains" */
  strictTransportSecurity?: string;
  /** Allow page rendering in frame @default "SAMEORIGIN" */
  xFrameOptions?: "DENY" | "SAMEORIGIN";
  /** Prevent MIME-sniffing @default true */
  xContentTypeOptions?: boolean;
  /** Control DNS prefetching @default false */
  xDnsPrefetchControl?: boolean;
  /** Prevent IE downloads in site context @default true */
  xDownloadOptions?: boolean;
  /** Cross-domain document loading policy @default "none" */
  xPermittedCrossDomainPolicies?:
    | "none"
    | "master-only"
    | "by-content-type"
    | "all";
  /** Legacy XSS protection (recommended: disable) @default "0" */
  xXssProtection?: "0" | "1" | "1; mode=block";
  /** Window opener browsing context group @default "same-origin" */
  crossOriginOpenerPolicy?:
    | "unsafe-none"
    | "same-origin-allow-popups"
    | "same-origin";
  /** Cross-origin resource sharing policy @default "same-origin"
   */
  crossOriginResourcePolicy?: "same-site" | "same-origin" | "cross-origin";
  /**
   * Prevents documents from sharing a browsing context group with cross-origin documents.
   * @default true
   */
  originAgentCluster?: boolean;
  /**
   * Remove the X-Powered-By header.
   * @default true
   */
  removeXPoweredBy?: boolean;
  /**
   * Controls browser feature permissions. Provide directives as an object mapping feature names to allowlists.
   *
   * Example: `{ geolocation: ["self"], camera: ["none"], microphone: ["self", "https://example.com"] }`
   */
  permissionsPolicy?: Record<string, string[]>;
}

/**
 * Build Permissions-Policy header from directives.
 * Converts object format to header string: `{ geolocation: ["self"] }` → `geolocation=(self)`
 */
const buildPermissionsPolicy = (
  policy: Record<string, string[]>,
): string => {
  return Object.entries(policy)
    .map(([feature, allowlist]) => {
      if (allowlist.length === 0 || allowlist.includes("none")) {
        return `${feature}=()`;
      }
      const values = allowlist
        .map((origin) => origin === "self" ? "self" : `"${origin}"`)
        .join(" ");
      return `${feature}=(${values})`;
    })
    .join(", ");
};

/**
 * Add security headers to protect against common web vulnerabilities.
 */
export const securityHeaders = (
  options?: SecurityHeadersOptions,
): MageMiddleware[] => {
  const {
    csp: cspOptions,
    referrerPolicy = "no-referrer",
    strictTransportSecurity = "max-age=15552000; includeSubDomains",
    xFrameOptions = "SAMEORIGIN",
    xContentTypeOptions = true,
    xDnsPrefetchControl = false,
    xDownloadOptions = true,
    xPermittedCrossDomainPolicies = "none",
    xXssProtection = "0",
    crossOriginOpenerPolicy = "same-origin",
    crossOriginResourcePolicy = "same-origin",
    originAgentCluster = true,
    removeXPoweredBy = true,
    permissionsPolicy,
  } = options ?? {};

  return [
    csp(cspOptions),
    async (c, next) => {
      c.header("Cross-Origin-Opener-Policy", crossOriginOpenerPolicy);
      c.header("Cross-Origin-Resource-Policy", crossOriginResourcePolicy);

      if (originAgentCluster) {
        c.header("Origin-Agent-Cluster", "?1");
      }

      if (permissionsPolicy) {
        c.header(
          "Permissions-Policy",
          buildPermissionsPolicy(permissionsPolicy),
        );
      }

      c.header("Referrer-Policy", referrerPolicy);
      c.header("Strict-Transport-Security", strictTransportSecurity);

      if (xContentTypeOptions) {
        c.header("X-Content-Type-Options", "nosniff");
      }

      c.header("X-DNS-Prefetch-Control", xDnsPrefetchControl ? "on" : "off");

      if (xDownloadOptions) {
        c.header("X-Download-Options", "noopen");
      }

      c.header("X-Frame-Options", xFrameOptions);
      c.header(
        "X-Permitted-Cross-Domain-Policies",
        xPermittedCrossDomainPolicies,
      );
      c.header("X-XSS-Protection", xXssProtection);

      if (removeXPoweredBy) {
        c.res.headers.delete("X-Powered-By");
      }

      await next();
    },
  ];
};
