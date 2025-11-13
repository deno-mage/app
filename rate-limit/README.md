# rate-limit

Middleware for rate limiting requests using a sliding window algorithm.

## Installation

```typescript
import { InMemoryRateLimitStore, rateLimit } from "@mage/app/rate-limit";
```

## Usage

```typescript
app.use(
  rateLimit({
    max: 100,
    windowMs: 60000, // 1 minute
    store: new InMemoryRateLimitStore({ maxKeys: 5000 }),
  }),
);
```

## Options

| Option         | Type             | Default                  | Description                             |
| -------------- | ---------------- | ------------------------ | --------------------------------------- |
| `max`          | `number`         | `100`                    | Max requests per window                 |
| `windowMs`     | `number`         | `60000` (1 min)          | Time window in milliseconds             |
| `store`        | `RateLimitStore` | `InMemoryRateLimitStore` | Storage backend                         |
| `keyGenerator` | `function`       | Extract IP from headers  | Function to generate rate limit key     |
| `message`      | `string`         | `"Too Many Requests"`    | Error message when rate limited         |
| `headers`      | `boolean`        | `true`                   | Include rate limit headers in responses |

## Store Options

**`InMemoryRateLimitStore`**

| Option    | Type     | Default | Description                         |
| --------- | -------- | ------- | ----------------------------------- |
| `maxKeys` | `number` | `5000`  | Max unique keys before LRU eviction |

## API

**`RateLimitStore` Interface**

- `hit(key, windowMs)` - Record a hit, returns current count
- `reset(key)` - Reset rate limit for a key

## Notes

- Uses sliding window algorithm for accurate rate limiting
- Returns 429 Too Many Requests when limit exceeded
- Includes `X-RateLimit-*` headers by default
- Sets `Retry-After` header when rate limited
- In-memory store uses LRU eviction to prevent unbounded growth
- Default key generator extracts IP from `X-Forwarded-For`, `X-Real-IP`, or
  connection
- Implement `RateLimitStore` interface for custom backends (Redis, etc.)
