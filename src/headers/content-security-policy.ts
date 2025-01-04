import type { MageContext } from "../context.ts";

interface ContentSecurityPolicyOptions {
  /**
   * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy#directives
   */
  directives: {
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
  };
}

const directiveKeyMap: Record<
  keyof ContentSecurityPolicyOptions["directives"],
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
};

/**
 * Apply a Content-Security-Policy header based on the provided options.
 *
 * @returns string
 */
export const contentSecurityPolicy = (
  context: MageContext,
  options: ContentSecurityPolicyOptions,
): void => {
  const header = Object.entries(options.directives)
    .map(([key, value]) => {
      const directive = directiveKeyMap[
        key as keyof ContentSecurityPolicyOptions["directives"]
      ];

      if (typeof value === "boolean") {
        return `${directive}`;
      }

      const directiveValue = Array.isArray(value) ? value.join(" ") : value;

      return `${directive} ${directiveValue}`;
    })
    .join(";");

  context.response.headers.set("Content-Security-Policy", header);
};
