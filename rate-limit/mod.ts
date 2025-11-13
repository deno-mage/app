/**
 * This module contains rate limiting middleware for Mage.
 * @module
 */

export {
  rateLimit,
  type RateLimitOptions,
  type RateLimitStore,
} from "./middleware.ts";
export { InMemoryRateLimitStore } from "./store.ts";
