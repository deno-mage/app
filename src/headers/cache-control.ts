import type { MageContext } from "../context.ts";

interface CacheControlOptions {
  /**
   * The number of seconds the response can be cached until it is stale.
   */
  maxAge?: number;
  /**
   * The number of seconds the response can be cached in shared cache until it is stale.
   */
  sMaxAge?: number;
  /**
   * Can be cached but origin server must be checked befor use.
   */
  noCache?: boolean;
  /**
   * No caches of the response can be stored.
   */
  noStore?: boolean;
  /**
   * Do not transform response contents when caching.
   */
  noTransform?: boolean;
  /**
   * Must revalidate stale cache entry before using it.
   */
  mustRevalidate?: boolean;
  /**
   * Must revalidate stale cache entry before using it (shared cache only).
   */
  proxyRevalidate?: boolean;
  /**
   * Responses can be cached only if store understands caching requirements based on status code.
   */
  mustUnderstand?: boolean;
  /**
   * Can be stored in private caches only (non-shared, ie browser cache).
   */
  private?: boolean;
  /**
   * Can be stored in public caches.
   */
  public?: boolean;
  /**
   * The cache response should not be updated while the cache is stll fresh.
   */
  immutable?: boolean;
  /**
   * The number of seconds a stale cache response can be used while the cache is being revalidated.
   */
  staleWhileRevalidate?: number;
  /**
   * The number of seconds a stale cache response can be used if the origin server is not available.
   */
  staleIfError?: number;
}

/**
 * Apply a Cache-Control header based on the provided options.
 *
 * @returns string
 */
export const cacheControl = (
  context: MageContext,
  options: CacheControlOptions,
): void => {
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

  context.response.headers.set("Cache-Control", values.join(", "));
};
