import type { MageContext, MageMiddleware } from "../app/mod.ts";
import { MageError } from "../app/mod.ts";
import { InMemoryRateLimitStore } from "./store.ts";

/**
 * Store interface for rate limiting.
 *
 * Implement this interface to create custom storage backends
 * (e.g., Redis, DynamoDB, etc.).
 */
export interface RateLimitStore {
  /**
   * Record a hit for a key and return the current count within the window.
   *
   * @param key The identifier (e.g., IP address)
   * @param windowMs The time window in milliseconds
   * @returns The number of hits within the window
   */
  hit(key: string, windowMs: number): Promise<number>;

  /**
   * Reset the rate limit for a key.
   *
   * @param key The identifier to reset
   */
  reset(key: string): Promise<void>;
}

/**
 * Function to extract the rate limit key from the request context.
 */
export type KeyGenerator = (c: MageContext) => string;

/**
 * Options for the rateLimit middleware.
 */
export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed within the window.
   * @default 100
   */
  max?: number;

  /**
   * Time window in milliseconds.
   * @default 60000 (1 minute)
   */
  windowMs?: number;

  /**
   * Storage backend for rate limit data.
   * @default InMemoryRateLimitStore
   */
  store?: RateLimitStore;

  /**
   * Function to generate rate limit key from request context.
   * @default Extract IP from request
   */
  keyGenerator?: KeyGenerator;

  /**
   * Custom message to return when rate limit is exceeded.
   */
  message?: string;

  /**
   * Whether to include rate limit headers in responses.
   * @default true
   */
  headers?: boolean;
}

/**
 * Default key generator that extracts IP address from request.
 */
const defaultKeyGenerator: KeyGenerator = (c: MageContext): string => {
  // Try to get real IP from common proxy headers
  const forwarded = c.req.header("X-Forwarded-For");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = c.req.header("X-Real-IP");
  if (realIp) {
    return realIp;
  }

  // Fallback to connection info (not available in all environments)
  // Use a default value for cases where we can't determine IP
  return "unknown";
};

/**
 * Middleware that limits the rate of requests from a single source.
 *
 * Uses a sliding window algorithm to track request counts. When the limit
 * is exceeded, returns a 429 Too Many Requests response.
 *
 * @param options Configuration options for rate limiting
 * @returns MageMiddleware
 */
export const rateLimit = (options?: RateLimitOptions): MageMiddleware => {
  const max = options?.max ?? 100;
  const windowMs = options?.windowMs ?? 60000; // 1 minute
  const store = options?.store ?? new InMemoryRateLimitStore();
  const keyGenerator = options?.keyGenerator ?? defaultKeyGenerator;
  const message = options?.message ?? "Too Many Requests";
  const includeHeaders = options?.headers ?? true;

  // Validation
  if (max <= 0) {
    throw new MageError(
      "[Rate Limit middleware] max must be a positive number",
    );
  }

  if (windowMs <= 0) {
    throw new MageError(
      "[Rate Limit middleware] windowMs must be a positive number",
    );
  }

  return async (c, next) => {
    const key = keyGenerator(c);

    // Record hit and get current count
    const hits = await store.hit(key, windowMs);

    // Set rate limit headers
    if (includeHeaders) {
      c.header("X-RateLimit-Limit", max.toString());
      c.header("X-RateLimit-Remaining", Math.max(0, max - hits).toString());
      c.header(
        "X-RateLimit-Reset",
        new Date(Date.now() + windowMs).toISOString(),
      );
    }

    // Check if rate limit exceeded
    if (hits > max) {
      c.header("Retry-After", Math.ceil(windowMs / 1000).toString());
      c.text(message, 429);
      return;
    }

    await next();
  };
};
