import type { MageMiddleware } from "../app/mod.ts";
import { csp, type CSPOptions } from "../csp/mod.ts";

/**
 * Options for the securityHeaders middleware.
 */
export interface SecurityHeadersOptions {
  /**
   * Options for Content-Security-Policy header.
   */
  csp?: CSPOptions;
  /**
   * Controls how much referrer information should be included with requests.
   * @default "no-referrer"
   */
  referrerPolicy?:
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url";
  /**
   * Instructs the browser to enforce HTTPS for the specified duration.
   * @default "max-age=15552000; includeSubDomains"
   */
  strictTransportSecurity?: string;
  /**
   * Indicates whether a browser should be allowed to render a page in a frame.
   * @default "SAMEORIGIN"
   */
  xFrameOptions?: "DENY" | "SAMEORIGIN";
  /**
   * Prevents browsers from MIME-sniffing a response away from the declared content-type.
   * @default true
   */
  xContentTypeOptions?: boolean;
  /**
   * Controls DNS prefetching.
   * @default false
   */
  xDnsPrefetchControl?: boolean;
  /**
   * Prevents Internet Explorer from downloading files in the context of your site.
   * @default true
   */
  xDownloadOptions?: boolean;
  /**
   * Restricts how documents can be loaded in cross-domain contexts.
   * @default "none"
   */
  xPermittedCrossDomainPolicies?:
    | "none"
    | "master-only"
    | "by-content-type"
    | "all";
  /**
   * Legacy XSS protection header (recommended to disable).
   * @default "0"
   */
  xXssProtection?: "0" | "1" | "1; mode=block";
  /**
   * Controls which window opener browsing context group to use.
   * @default "same-origin"
   */
  crossOriginOpenerPolicy?:
    | "unsafe-none"
    | "same-origin-allow-popups"
    | "same-origin";
  /**
   * Controls sharing of resources across origins.
   * @default "same-origin"
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
 * Build Permissions-Policy header from directives
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
 * Adds security headers to the response to help protect against common web
 * vulnerabilities.
 *
 * @param options Configuration options for security headers
 * @returns MageMiddleware
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
