import type { MageContext, MageMiddleware } from "../app/mod.ts";

type IsAllowedOriginHandler = (origin: string, context: MageContext) => boolean;

const secFetchSiteValues = [
  "same-origin",
  "same-site",
  "none",
  "cross-site",
] as const;
type SecFetchSite = (typeof secFetchSiteValues)[number];

const isSecFetchSite = (value: string): value is SecFetchSite =>
  (secFetchSiteValues as readonly string[]).includes(value);

type IsAllowedSecFetchSiteHandler = (
  secFetchSite: SecFetchSite,
  context: MageContext,
) => boolean;

/**
 * CSRF protection options.
 */
export interface CsrfOptions {
  /**
   * Allowed origins for requests.
   * - string: Single allowed origin (e.g., 'https://example.com')
   * - string[]: Multiple allowed origins
   * - function: Custom validation logic
   * - Default: Only same origin as the request URL
   */
  origin?: string | string[] | IsAllowedOriginHandler;

  /**
   * Sec-Fetch-Site header validation. Standard values include 'same-origin', 'same-site', 'cross-site', 'none'.
   * - string: Single allowed value (e.g., 'same-origin')
   * - string[]: Multiple allowed values (e.g., ['same-origin', 'same-site'])
   * - function: Custom validation with access to context
   * - Default: Only allows 'same-origin'
   */
  secFetchSite?: SecFetchSite | SecFetchSite[] | IsAllowedSecFetchSiteHandler;
}

const isSafeMethodRe = /^(GET|HEAD)$/;
const isRequestedByFormElementRe =
  /^\b(application\/x-www-form-urlencoded|multipart\/form-data|text\/plain)\b/i;

/**
 * CSRF protection middleware using Fetch Metadata and Origin validation.
 *
 * Protects against Cross-Site Request Forgery attacks by validating request origins
 * and sec-fetch-site headers. The request is allowed if either validation passes.
 *
 * Only checks unsafe methods (POST, PUT, DELETE, PATCH) with form-based content types.
 * JSON/API requests are not checked as they require custom headers that trigger CORS preflight.
 */
export const csrf = (options?: CsrfOptions): MageMiddleware => {
  const originHandler: IsAllowedOriginHandler = ((optsOrigin) => {
    if (!optsOrigin) {
      return (origin, c) => origin === c.req.url.origin;
    } else if (typeof optsOrigin === "string") {
      return (origin) => origin === optsOrigin;
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin);
    }
  })(options?.origin);

  const isAllowedOrigin = (origin: string | undefined, c: MageContext) => {
    if (origin === undefined) {
      // denied always when origin header is not present
      return false;
    }
    return originHandler(origin, c);
  };

  const secFetchSiteHandler: IsAllowedSecFetchSiteHandler = ((
    optsSecFetchSite,
  ) => {
    if (!optsSecFetchSite) {
      // Default: only allow same-origin
      return (secFetchSite) => secFetchSite === "same-origin";
    } else if (typeof optsSecFetchSite === "string") {
      return (secFetchSite) => secFetchSite === optsSecFetchSite;
    } else if (typeof optsSecFetchSite === "function") {
      return optsSecFetchSite;
    } else {
      return (secFetchSite) => optsSecFetchSite.includes(secFetchSite);
    }
  })(options?.secFetchSite);

  const isAllowedSecFetchSite = (
    secFetchSite: string | undefined,
    c: MageContext,
  ) => {
    if (secFetchSite === undefined) {
      // denied always when sec-fetch-site header is not present
      return false;
    }
    // type guard to check if the value is a valid SecFetchSite
    if (!isSecFetchSite(secFetchSite)) {
      return false;
    }
    return secFetchSiteHandler(secFetchSite, c);
  };

  return async (ctx: MageContext, next) => {
    const method = ctx.req.method;
    const contentType = ctx.req.raw.headers.get("content-type") || "text/plain";
    const secFetchSite = ctx.req.raw.headers.get("sec-fetch-site") ?? undefined;
    const origin = ctx.req.raw.headers.get("origin") ?? undefined;

    if (
      !isSafeMethodRe.test(method) &&
      isRequestedByFormElementRe.test(contentType) &&
      !isAllowedSecFetchSite(secFetchSite, ctx) &&
      !isAllowedOrigin(origin, ctx)
    ) {
      ctx.forbidden();
      return;
    }

    await next();
  };
};
