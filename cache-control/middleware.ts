import type { MageMiddleware } from "../app/mod.ts";
import { MageError } from "../app/mod.ts";

/**
 * Options for the cacheControl middleware.
 */
export interface CacheControlOptions {
  /** Seconds the response can be cached until stale */
  maxAge?: number;
  /** Seconds the response can be cached in shared cache until stale */
  sMaxAge?: number;
  /** Can be cached but origin must be checked before use */
  noCache?: boolean;
  /** No caching allowed */
  noStore?: boolean;
  /** Do not transform response when caching */
  noTransform?: boolean;
  /** Must revalidate stale cache before use */
  mustRevalidate?: boolean;
  /** Must revalidate stale cache before use (shared cache only) */
  proxyRevalidate?: boolean;
  /** Cache only if store understands caching requirements */
  mustUnderstand?: boolean;
  /** Store in private caches only (browser cache) */
  private?: boolean;
  /** Can be stored in public caches */
  public?: boolean;
  /** Cache should not be updated while still fresh */
  immutable?: boolean;
  /** Seconds stale cache can be used while revalidating */
  staleWhileRevalidate?: number;
  /** Seconds stale cache can be used if origin unavailable */
  staleIfError?: number;
}

/**
 * Set Cache-Control header based on provided directives.
 *
 * @throws MageError if conflicting directives are specified
 */
export const cacheControl = (
  options: CacheControlOptions,
): MageMiddleware => {
  // Validate conflicting directives
  if (options.public && options.private) {
    throw new MageError(
      "[Cache-Control middleware] Cannot use both 'public' and 'private' directives",
    );
  }

  if (options.noStore && (options.maxAge || options.sMaxAge)) {
    throw new MageError(
      "[Cache-Control middleware] 'noStore' conflicts with 'maxAge' or 'sMaxAge' directives",
    );
  }

  if (options.immutable && options.noCache) {
    throw new MageError(
      "[Cache-Control middleware] 'immutable' conflicts with 'noCache' directive",
    );
  }

  if (options.mustRevalidate && options.noCache) {
    throw new MageError(
      "[Cache-Control middleware] 'mustRevalidate' is redundant with 'noCache' directive",
    );
  }

  return async (c, next) => {
    const values = [];

    if (options.maxAge) {
      values.push(`max-age=${options.maxAge}`);
    }

    if (options.sMaxAge) {
      values.push(`s-maxage=${options.sMaxAge}`);
    }

    if (options.noCache) {
      values.push("no-cache");
    }

    if (options.noStore) {
      values.push("no-store");
    }

    if (options.noTransform) {
      values.push("no-transform");
    }

    if (options.mustRevalidate) {
      values.push("must-revalidate");
    }

    if (options.proxyRevalidate) {
      values.push("proxy-revalidate");
    }

    if (options.mustUnderstand) {
      values.push("must-understand");
    }

    if (options.private) {
      values.push("private");
    }

    if (options.public) {
      values.push("public");
    }

    if (options.immutable) {
      values.push("immutable");
    }

    if (options.staleWhileRevalidate) {
      values.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
    }

    if (options.staleIfError) {
      values.push(`stale-if-error=${options.staleIfError}`);
    }

    const header = values.join(", ");

    c.header(
      "Cache-Control",
      header,
    );

    await next();
  };
};
