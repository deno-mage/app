import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { InMemoryRateLimitStore, rateLimit } from "../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  // Default rate limit (100 requests per minute)
  server.app.get("/default", rateLimit(), (c) => {
    c.text("OK");
  });

  // Strict rate limit (3 requests per second)
  server.app.get(
    "/strict",
    rateLimit({
      max: 3,
      windowMs: 1000,
    }),
    (c) => {
      c.text("OK");
    },
  );

  // Custom message
  server.app.get(
    "/custom-message",
    rateLimit({
      max: 1,
      windowMs: 1000,
      message: "Slow down!",
    }),
    (c) => {
      c.text("OK");
    },
  );

  // No headers
  server.app.get(
    "/no-headers",
    rateLimit({
      max: 2,
      windowMs: 1000,
      headers: false,
    }),
    (c) => {
      c.text("OK");
    },
  );

  // Custom key generator (always same key for testing)
  server.app.get(
    "/custom-key",
    rateLimit({
      max: 2,
      windowMs: 1000,
      keyGenerator: () => "test-key",
    }),
    (c) => {
      c.text("OK");
    },
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("rate-limit", () => {
  it("should allow requests under the limit", async () => {
    const response = await fetch(server.url("/default"), {
      method: "GET",
    });

    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toBe("OK");
  });

  it("should include rate limit headers", async () => {
    const response = await fetch(server.url("/default"), {
      method: "GET",
    });

    await response.text();

    expect(response.headers.get("X-RateLimit-Limit")).toBe("100");

    // Should have remaining count
    const remaining = response.headers.get("X-RateLimit-Remaining");
    expect(remaining).not.toBeNull();
    const remainingCount = parseInt(remaining!, 10);
    expect(remainingCount).toBeGreaterThanOrEqual(0);
    expect(remainingCount).toBeLessThanOrEqual(100);

    // Should have reset timestamp
    const reset = response.headers.get("X-RateLimit-Reset");
    expect(reset).not.toBeNull();
    const resetDate = new Date(reset!);
    expect(resetDate.getTime()).toBeGreaterThan(Date.now());
  });

  it("should block requests exceeding strict limit", async () => {
    // Make 4 requests (limit is 3)
    const responses = await Promise.all([
      fetch(server.url("/strict")),
      fetch(server.url("/strict")),
      fetch(server.url("/strict")),
      fetch(server.url("/strict")),
    ]);

    // Drain all responses
    await Promise.all(responses.map((r) => r.text()));

    // First 3 should succeed
    expect(responses[0].status).toBe(200);
    expect(responses[1].status).toBe(200);
    expect(responses[2].status).toBe(200);

    // Check rate limit headers on successful request
    expect(responses[0].headers.get("X-RateLimit-Limit")).toBe("3");
    const remaining = responses[0].headers.get("X-RateLimit-Remaining");
    expect(remaining).not.toBeNull();
    expect(parseInt(remaining!, 10)).toBeLessThanOrEqual(3);

    // 4th should be rate limited
    expect(responses[3].status).toBe(429);

    // Should have Retry-After header
    const retryAfter = responses[3].headers.get("Retry-After");
    expect(retryAfter).not.toBeNull();
    expect(parseInt(retryAfter!, 10)).toBeLessThanOrEqual(1); // 1 second window
  });

  it("should include Retry-After header when rate limited", async () => {
    // Exhaust limit
    await (await fetch(server.url("/custom-message"))).text();
    const response = await fetch(server.url("/custom-message"));

    await response.text();

    expect(response.status).toBe(429);

    const retryAfter = response.headers.get("Retry-After");
    expect(retryAfter).not.toBeNull();
    const retryAfterSeconds = parseInt(retryAfter!, 10);
    expect(retryAfterSeconds).toBeGreaterThan(0);
    expect(retryAfterSeconds).toBeLessThanOrEqual(1); // windowMs is 1000ms = 1 second
  });

  it("should use custom message when rate limited", async () => {
    // Create isolated test server for this
    const testServer = new MageTestServer();
    testServer.app.get(
      "/test",
      rateLimit({
        max: 1,
        windowMs: 60000,
        message: "Custom limit message",
      }),
      (c) => {
        c.text("OK");
      },
    );
    testServer.start();

    // First request OK
    await (await fetch(testServer.url("/test"))).text();

    // Second request should be rate limited
    const response = await fetch(testServer.url("/test"));
    const text = await response.text();

    expect(response.status).toBe(429);
    expect(text).toContain("Custom limit message");

    await testServer.stop();
  });

  it("should not include headers when headers option is false", async () => {
    const response = await fetch(server.url("/no-headers"), {
      method: "GET",
    });

    await response.text();

    expect(response.headers.has("X-RateLimit-Limit")).toBe(false);
    expect(response.headers.has("X-RateLimit-Remaining")).toBe(false);
    expect(response.headers.has("X-RateLimit-Reset")).toBe(false);
  });

  it("should reset after window expires", async () => {
    const testServer = new MageTestServer();
    testServer.app.get(
      "/test",
      rateLimit({
        max: 1,
        windowMs: 100, // Very short window
        keyGenerator: () => "reset-test",
      }),
      (c) => {
        c.text("OK");
      },
    );
    testServer.start();

    // First request OK
    const first = await fetch(testServer.url("/test"));
    await first.text();
    expect(first.status).toBe(200);

    // Second request should be limited
    const second = await fetch(testServer.url("/test"));
    await second.text();
    expect(second.status).toBe(429);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Third request should be OK (window reset)
    const third = await fetch(testServer.url("/test"));
    await third.text();
    expect(third.status).toBe(200);

    await testServer.stop();
  });

  it("should use X-Forwarded-For header for key generation", async () => {
    const testServer = new MageTestServer();
    testServer.app.get(
      "/test",
      rateLimit({
        max: 2,
        windowMs: 1000,
      }),
      (c) => {
        c.text("OK");
      },
    );
    testServer.start();

    // Make requests with same X-Forwarded-For IP
    const ip = "203.0.113.1";
    const responses = await Promise.all([
      fetch(testServer.url("/test"), {
        headers: { "X-Forwarded-For": `${ip}, 192.168.1.1` },
      }),
      fetch(testServer.url("/test"), {
        headers: { "X-Forwarded-For": `${ip}, 192.168.1.2` },
      }),
      fetch(testServer.url("/test"), {
        headers: { "X-Forwarded-For": `${ip}, 192.168.1.3` },
      }),
    ]);

    await Promise.all(responses.map((r) => r.text()));

    // First 2 should succeed (from same IP)
    expect(responses[0].status).toBe(200);
    expect(responses[1].status).toBe(200);

    // 3rd should be rate limited (same IP, exceeded limit)
    expect(responses[2].status).toBe(429);

    await testServer.stop();
  });

  it("should use X-Real-IP header for key generation", async () => {
    const testServer = new MageTestServer();
    testServer.app.get(
      "/test",
      rateLimit({
        max: 2,
        windowMs: 1000,
      }),
      (c) => {
        c.text("OK");
      },
    );
    testServer.start();

    // Make requests with same X-Real-IP
    const ip = "198.51.100.1";
    const responses = await Promise.all([
      fetch(testServer.url("/test"), {
        headers: { "X-Real-IP": ip },
      }),
      fetch(testServer.url("/test"), {
        headers: { "X-Real-IP": ip },
      }),
      fetch(testServer.url("/test"), {
        headers: { "X-Real-IP": ip },
      }),
    ]);

    await Promise.all(responses.map((r) => r.text()));

    // First 2 should succeed
    expect(responses[0].status).toBe(200);
    expect(responses[1].status).toBe(200);

    // 3rd should be rate limited
    expect(responses[2].status).toBe(429);

    await testServer.stop();
  });

  it("should use custom key generator function", async () => {
    const testServer = new MageTestServer();
    const customKeys: string[] = [];

    testServer.app.get(
      "/test",
      rateLimit({
        max: 2,
        windowMs: 1000,
        keyGenerator: (c) => {
          // Generate key based on custom header
          const key = c.req.header("X-User-ID") || "anonymous";
          customKeys.push(key);
          return key;
        },
      }),
      (c) => {
        c.text("OK");
      },
    );
    testServer.start();

    // Requests with same X-User-ID
    const responses = await Promise.all([
      fetch(testServer.url("/test"), {
        headers: { "X-User-ID": "user-123" },
      }),
      fetch(testServer.url("/test"), {
        headers: { "X-User-ID": "user-123" },
      }),
      fetch(testServer.url("/test"), {
        headers: { "X-User-ID": "user-123" },
      }),
    ]);

    await Promise.all(responses.map((r) => r.text()));

    // First 2 should succeed
    expect(responses[0].status).toBe(200);
    expect(responses[1].status).toBe(200);

    // 3rd should be rate limited (same user)
    expect(responses[2].status).toBe(429);

    // Verify custom key generator was called
    expect(customKeys).toEqual(["user-123", "user-123", "user-123"]);

    await testServer.stop();
  });

  it("should rate limit independently for different IPs", async () => {
    const testServer = new MageTestServer();
    testServer.app.get(
      "/test",
      rateLimit({
        max: 1,
        windowMs: 1000,
      }),
      (c) => {
        c.text("OK");
      },
    );
    testServer.start();

    // Different IPs should have independent rate limits
    const response1a = await fetch(testServer.url("/test"), {
      headers: { "X-Forwarded-For": "203.0.113.1" },
    });
    const response2a = await fetch(testServer.url("/test"), {
      headers: { "X-Forwarded-For": "203.0.113.2" },
    });

    await response1a.text();
    await response2a.text();

    // Both should succeed (different IPs)
    expect(response1a.status).toBe(200);
    expect(response2a.status).toBe(200);

    // Second request from IP 1 should be rate limited
    const response1b = await fetch(testServer.url("/test"), {
      headers: { "X-Forwarded-For": "203.0.113.1" },
    });
    await response1b.text();
    expect(response1b.status).toBe(429);

    // But IP 2 can still make another request
    const response2b = await fetch(testServer.url("/test"), {
      headers: { "X-Forwarded-For": "203.0.113.2" },
    });
    await response2b.text();
    expect(response2b.status).toBe(429); // This is also the second request from IP2

    await testServer.stop();
  });

  it("should prioritize X-Forwarded-For over X-Real-IP", async () => {
    const testServer = new MageTestServer();
    testServer.app.get(
      "/test",
      rateLimit({
        max: 1,
        windowMs: 1000,
      }),
      (c) => {
        c.text("OK");
      },
    );
    testServer.start();

    // First request with X-Forwarded-For
    const first = await fetch(testServer.url("/test"), {
      headers: {
        "X-Forwarded-For": "203.0.113.1",
        "X-Real-IP": "198.51.100.1",
      },
    });
    await first.text();
    expect(first.status).toBe(200);

    // Second request with same X-Forwarded-For but different X-Real-IP
    // Should be rate limited because X-Forwarded-For takes priority
    const second = await fetch(testServer.url("/test"), {
      headers: {
        "X-Forwarded-For": "203.0.113.1",
        "X-Real-IP": "198.51.100.99", // Different IP
      },
    });
    await second.text();
    expect(second.status).toBe(429);

    await testServer.stop();
  });

  describe("validation", () => {
    it("should throw error when max is zero", () => {
      expect(() => {
        rateLimit({ max: 0 });
      }).toThrow("[Rate Limit middleware] max must be a positive number");
    });

    it("should throw error when max is negative", () => {
      expect(() => {
        rateLimit({ max: -1 });
      }).toThrow("[Rate Limit middleware] max must be a positive number");
    });

    it("should throw error when windowMs is zero", () => {
      expect(() => {
        rateLimit({ windowMs: 0 });
      }).toThrow("[Rate Limit middleware] windowMs must be a positive number");
    });

    it("should throw error when windowMs is negative", () => {
      expect(() => {
        rateLimit({ windowMs: -1 });
      }).toThrow("[Rate Limit middleware] windowMs must be a positive number");
    });
  });
});

describe("InMemoryRateLimitStore", () => {
  it("should track hits correctly", async () => {
    const store = new InMemoryRateLimitStore();

    const hit1 = await store.hit("test", 60000);
    const hit2 = await store.hit("test", 60000);
    const hit3 = await store.hit("test", 60000);

    expect(hit1).toBe(1);
    expect(hit2).toBe(2);
    expect(hit3).toBe(3);
  });

  it("should expire old hits outside window", async () => {
    const store = new InMemoryRateLimitStore();

    await store.hit("test", 100);
    await new Promise((resolve) => setTimeout(resolve, 150));
    const count = await store.hit("test", 100);

    // Should only count the new hit, old one expired
    expect(count).toBe(1);
  });

  it("should reset key", async () => {
    const store = new InMemoryRateLimitStore();

    await store.hit("test", 60000);
    await store.hit("test", 60000);
    expect(store.size).toBe(1);

    await store.reset("test");
    expect(store.size).toBe(0);

    const count = await store.hit("test", 60000);
    expect(count).toBe(1);
  });

  it("should evict LRU keys when max keys exceeded", async () => {
    const store = new InMemoryRateLimitStore({ maxKeys: 3 });

    await store.hit("key1", 60000);
    await store.hit("key2", 60000);
    await store.hit("key3", 60000);

    expect(store.size).toBe(3);

    // Add 4th key, should evict key1 (least recently used)
    await store.hit("key4", 60000);

    expect(store.size).toBe(3);

    // Key1 should be evicted, so hitting it should start at 1
    const count = await store.hit("key1", 60000);
    expect(count).toBe(1);
  });

  it("should update LRU order on access", async () => {
    const store = new InMemoryRateLimitStore({ maxKeys: 3 });

    await store.hit("key1", 60000);
    await store.hit("key2", 60000);
    await store.hit("key3", 60000);

    // Access key1 again to make it most recently used
    await store.hit("key1", 60000);

    // Add key4, should evict key2 (now LRU)
    await store.hit("key4", 60000);

    // key2 should be evicted
    const countKey2 = await store.hit("key2", 60000);
    expect(countKey2).toBe(1);

    // key1 should still exist with 2 hits
    const countKey1 = await store.hit("key1", 60000);
    expect(countKey1).toBe(3);
  });
});
