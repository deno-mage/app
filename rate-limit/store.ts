import type { RateLimitStore } from "./middleware.ts";

/**
 * Options for in-memory rate limit store.
 */
export interface InMemoryRateLimitStoreOptions {
  /**
   * Maximum number of unique keys to track before evicting least recently used.
   * @default 5000
   */
  maxKeys?: number;
}

/**
 * In-memory rate limit store with LRU eviction.
 *
 * Tracks request timestamps per key and automatically evicts least recently
 * used keys when maxKeys is reached to prevent unbounded memory growth.
 */
export class InMemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, number[]> = new Map();
  private accessOrder: string[] = [];
  private maxKeys: number;

  constructor(options?: InMemoryRateLimitStoreOptions) {
    this.maxKeys = options?.maxKeys ?? 5000;
  }

  hit(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing hits and filter out expired ones
    const hits = this.store.get(key) || [];
    const validHits = hits.filter((timestamp) => timestamp > windowStart);

    // Add current hit
    validHits.push(now);

    // Update store
    this.store.set(key, validHits);

    // Update LRU access order
    this.updateAccessOrder(key);

    // Evict LRU if over limit
    if (this.store.size > this.maxKeys) {
      this.evictLRU();
    }

    return Promise.resolve(validHits.length);
  }

  reset(key: string): Promise<void> {
    this.store.delete(key);
    this.accessOrder = this.accessOrder.filter((k) => k !== key);

    return Promise.resolve();
  }

  /**
   * Update the access order for LRU tracking.
   */
  private updateAccessOrder(key: string): void {
    // Remove key from current position
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Evict the least recently used key.
   */
  private evictLRU(): void {
    const lruKey = this.accessOrder.shift();
    if (lruKey) {
      this.store.delete(lruKey);
    }
  }

  /**
   * Get current store size (for testing/monitoring).
   */
  get size(): number {
    return this.store.size;
  }
}
