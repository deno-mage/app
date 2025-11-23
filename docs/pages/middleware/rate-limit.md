---
title: "Rate Limit"
description: "Limit request rates to prevent abuse and DoS attacks"
---

# Rate Limit

The rate limit middleware protects your application from abuse by restricting
the number of requests from a single source within a specified time window. It
returns a 429 Too Many Requests response when limits are exceeded.

## Quick Start

```typescript
import { MageApp } from "@mage/app";
import { rateLimit } from "@mage/rate-limit";

const app = new MageApp();

// Limit to 100 requests per minute per IP
app.use(
  rateLimit({
    max: 100,
    windowMs: 60000,
  }),
);

app.get("/api/data", (c) => {
  return c.json({ message: "This endpoint is rate limited" });
});

Deno.serve(app.handler);
```

## How It Works

Uses sliding window algorithm to track requests. Detects client IP from
`X-Forwarded-For` or `X-Real-IP` headers by default. Returns 429 when limit
exceeded.

Includes rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`,
`X-RateLimit-Reset`, and `Retry-After` (when limited).

## Options

| Option         | Type                         | Default                  | Description                                     |
| -------------- | ---------------------------- | ------------------------ | ----------------------------------------------- |
| `max`          | `number`                     | `100`                    | Maximum requests allowed within the time window |
| `windowMs`     | `number`                     | `60000`                  | Time window in milliseconds                     |
| `keyGenerator` | `(c: MageContext) => string` | IP detection             | Function to generate a unique key per client    |
| `store`        | `RateLimitStore`             | `InMemoryRateLimitStore` | Storage backend for tracking request counts     |
| `message`      | `string`                     | `"Too Many Requests"`    | Custom error message when rate limit exceeded   |
| `headers`      | `boolean`                    | `true`                   | Include rate limit headers in responses         |

## Storage Backends

### In-Memory Store (Default)

The built-in in-memory store is suitable for single-instance applications:

```typescript
import { MageApp } from "@mage/app";
import { InMemoryRateLimitStore, rateLimit } from "@mage/rate-limit";

const app = new MageApp();

const store = new InMemoryRateLimitStore({
  maxKeys: 5000, // Maximum unique IP addresses to track
});

app.use(
  rateLimit({
    max: 100,
    windowMs: 60000,
    store,
  }),
);
```

The in-memory store automatically removes expired timestamps and uses LRU
eviction when the key limit is reached. This prevents unbounded memory growth.

### Custom Store Implementation

For distributed deployments, implement the `RateLimitStore` interface to use
Redis, DynamoDB, or other backends:

```typescript
import type { RateLimitStore } from "@mage/rate-limit";

class RedisRateLimitStore implements RateLimitStore {
  constructor(private redis: Redis) {}

  async hit(key: string, windowMs: number): Promise<number> {
    const windowStart = Date.now() - windowMs;

    // Add current timestamp to sorted set
    await this.redis.zadd(key, Date.now(), Math.random().toString());

    // Remove expired timestamps
    await this.redis.zremrangebyscore(key, 0, windowStart);

    // Set expiration on key
    await this.redis.expire(key, Math.ceil(windowMs / 1000));

    // Get current count
    const count = await this.redis.zcard(key);
    return count;
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
```

## Examples

### Strict Per-IP Rate Limiting

```typescript
import { MageApp } from "@mage/app";
import { rateLimit } from "@mage/rate-limit";

const app = new MageApp();

// 30 requests per 5 minutes per IP
app.use(
  rateLimit({
    max: 30,
    windowMs: 5 * 60 * 1000,
  }),
);
```

### Custom Key Generation

Rate limit by user ID instead of IP, useful for authenticated APIs:

```typescript
import { MageApp } from "@mage/app";
import { rateLimit } from "@mage/rate-limit";

const app = new MageApp();

app.use(
  rateLimit({
    max: 1000,
    windowMs: 60000,
    keyGenerator: (c) => {
      // Rate limit per user if authenticated, fallback to IP
      const userId = c.get("userId");
      return userId
        ? `user:${userId}`
        : `ip:${c.req.header("x-forwarded-for") || "unknown"}`;
    },
  }),
);

app.get("/api/protected", (c) => {
  const userId = c.get("userId");
  return c.json({ message: `Hello user ${userId}` });
});
```

### Different Limits for Different Endpoints

```typescript
import { MageApp } from "@mage/app";
import { rateLimit } from "@mage/rate-limit";

const app = new MageApp();

// Strict limit for login attempts
const loginLimiter = rateLimit({
  max: 5,
  windowMs: 15 * 60 * 1000, // 5 attempts per 15 minutes
  message: "Too many login attempts, please try again later",
});

// Normal limit for API endpoints
const apiLimiter = rateLimit({
  max: 100,
  windowMs: 60000,
});

// Loose limit for public endpoints
const publicLimiter = rateLimit({
  max: 1000,
  windowMs: 60000,
});

// Apply different limiters
app.post("/auth/login", loginLimiter, (c) => {
  return c.json({ token: "..." });
});

app.get("/api/data", apiLimiter, (c) => {
  return c.json({ data: [...] });
});

app.get("/public/status", publicLimiter, (c) => {
  return c.text("OK");
});
```

### Custom Error Response

```typescript
import { MageApp, MageError } from "@mage/app";
import { rateLimit } from "@mage/rate-limit";

const app = new MageApp();

app.use(
  rateLimit({
    max: 100,
    windowMs: 60000,
    message: "Rate limit exceeded. Please try again later.",
  }),
);

// Or handle rate limit errors with custom JSON response
app.use(async (c, next) => {
  try {
    await next();
  } catch (err) {
    if (err instanceof MageError && err.status === 429) {
      return c.json({
        error: "Rate limit exceeded",
        message: "Please try again later",
        retryAfter: c.res.headers.get("Retry-After"),
      }, 429);
    }
    throw err;
  }
});
```

### Monitoring Rate Limit Usage

```typescript
import { MageApp } from "@mage/app";
import { rateLimit } from "@mage/rate-limit";

const app = new MageApp();

app.use(
  rateLimit({
    max: 100,
    windowMs: 60000,
    headers: true, // Ensures headers are included
  }),
);

app.get("/api/stats", (c) => {
  // Client can read rate limit headers from response
  const limit = c.res.headers.get("x-ratelimit-limit");
  const remaining = c.res.headers.get("x-ratelimit-remaining");
  const reset = c.res.headers.get("x-ratelimit-reset");

  return c.json({
    limit,
    remaining,
    reset,
  });
});
```

## Security Considerations

**Protects against**: Brute force, API abuse, resource exhaustion, enumeration
attacks

**Important**: In-memory store only works for single instance. Use Redis for
distributed deployments to prevent attackers from bypassing limits across
multiple servers.

**IP spoofing**: Only use IP-based limiting behind trusted reverse proxies.
Otherwise, rate limit by authenticated user ID.

**Memory**: Default stores ~5,000 IPs × 100 requests each (~250MB max). Adjust
`maxKeys` for high-traffic apps or use external store.

## Notes

- Place early in middleware stack to fail fast
- Use shared store (Redis) for clustering/distributed deployments
- In-memory store auto-cleans expired timestamps

## Related

- [Middleware](/core/middleware) - How middleware works in Mage
- [MageContext](/core/mage-context) - Accessing headers and setting responses
- [CORS Middleware](/middleware/cors) - Cross-origin request handling
- [Security Headers](/middleware/csp) - Additional security middleware
