import type { MageContext, MageMiddleware } from "../app/mod.ts";

type CSPDirectives = {
  childSrc?: string | string[];
  connectSrc?: string | string[];
  defaultSrc?: string | string[];
  fontSrc?: string | string[];
  frameSrc?: string | string[];
  imgSrc?: string | string[];
  manifestSrc?: string | string[];
  mediaSrc?: string | string[];
  objectSrc?: string | string[];
  prefetchSrc?: string | string[];
  scriptSrc?: string | string[];
  scriptSrcElem?: string | string[];
  scriptSrcAttr?: string | string[];
  styleSrc?: string | string[];
  styleSrcElem?: string | string[];
  styleSrcAttr?: string | string[];
  workerSrc?: string | string[];
  baseUri?: string | string[];
  sandbox?: string | string[];
  formAction?: string | string[];
  frameAncestors?: string | string[];
  reportTo?: string | string[];
  upgradeInsecureRequests?: boolean;
  trustedTypes?: string | string[];
  requireTrustedTypesFor?: string | string[];
};

/**
 * Options for the csp middleware
 */
export interface CSPOptions {
  /**
   * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy#directives
   *
   * Can be a static object or a function that returns directives based on the request context.
   * Use a function for dynamic CSP policies (e.g., with nonces).
   */
  directives: CSPDirectives | ((c: MageContext) => CSPDirectives);
}

const directiveKeyMap: Record<
  keyof CSPOptions["directives"],
  string
> = {
  childSrc: "child-src",
  connectSrc: "connect-src",
  defaultSrc: "default-src",
  fontSrc: "font-src",
  frameSrc: "frame-src",
  imgSrc: "img-src",
  manifestSrc: "manifest-src",
  mediaSrc: "media-src",
  objectSrc: "object-src",
  prefetchSrc: "prefetch-src",
  scriptSrc: "script-src",
  scriptSrcElem: "script-src-elem",
  scriptSrcAttr: "script-src-attr",
  styleSrc: "style-src",
  styleSrcElem: "style-src-elem",
  styleSrcAttr: "style-src-attr",
  workerSrc: "worker-src",
  baseUri: "base-uri",
  sandbox: "sandbox",
  formAction: "form-action",
  frameAncestors: "frame-ancestors",
  reportTo: "report-to",
  upgradeInsecureRequests: "upgrade-insecure-requests",
  trustedTypes: "trusted-types",
  requireTrustedTypesFor: "require-trusted-types-for",
};

/**
 * Build CSP header string from directives
 */
const buildHeader = (directives: CSPDirectives): string => {
  return Object.entries(directives)
    .map(([key, value]) => {
      const directive = directiveKeyMap[key as keyof CSPOptions["directives"]];

      if (typeof value === "boolean") {
        if (value) {
          return `${directive}`;
        }

        return "";
      }

      const directiveValue = Array.isArray(value) ? value.join(" ") : value;

      return `${directive} ${directiveValue}`;
    })
    .filter(Boolean)
    .join(";");
};

/**
 * Apply a Content-Security-Policy header based on the provided options.
 *
 * @param options
 * @returns MageMiddleware
 */
export const csp = (options?: CSPOptions): MageMiddleware => {
  const defaultDirectives = {
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
  };

  // Dynamic CSP: directives computed per-request
  if (typeof options?.directives === "function") {
    const directivesCallback = options.directives;

    return async (c, next) => {
      const dynamicDirectives = directivesCallback(c);
      const header = buildHeader({
        ...defaultDirectives,
        ...dynamicDirectives,
      });

      c.header("Content-Security-Policy", header);
      await next();
    };
  }

  // Static CSP: header computed once (current behavior, best performance)
  const header = buildHeader({
    ...defaultDirectives,
    ...options?.directives,
  });

  return async (c, next) => {
    c.header(
      "Content-Security-Policy",
      header,
    );

    await next();
  };
};
