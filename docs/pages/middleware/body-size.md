---
title: "Body Size"
description: "Limit request body size to prevent DoS attacks and memory exhaustion"
---

# Body Size

The Body Size middleware protects your application from denial-of-service (DoS)
attacks by rejecting requests with bodies exceeding a configured limit. This
prevents attackers from exhausting your server's memory.

## Quick Start

```typescript
import { MageApp } from "@mage/app";
import { bodySize } from "@mage/body-size";

const app = new MageApp();

// Reject requests larger than 5MB
app.use(bodySize({ maxSize: 5 * 1024 * 1024 }));

app.post("/upload", async (c) => {
  const data = await c.req.json();
  return c.json({ received: true });
});

Deno.serve(app.handler);
```

## How It Works

Checks `Content-Length` header before processing. Rejects requests exceeding
limit with 413 before reading body into memory. Default: 1MB.

## Options

| Option    | Type     | Default   | Description                                                          |
| --------- | -------- | --------- | -------------------------------------------------------------------- |
| `maxSize` | `number` | `1048576` | Maximum request body size in bytes (1MB). Must be a positive number. |

## Examples

### Allow Larger Uploads

For applications that accept file uploads, increase the limit:

```typescript
import { MageApp } from "@mage/app";
import { bodySize } from "@mage/body-size";

const app = new MageApp();

// Allow up to 100MB for file uploads
app.use(bodySize({ maxSize: 100 * 1024 * 1024 }));

app.post("/files/upload", async (c) => {
  const file = await c.req.formData();
  // Process file...
  return c.json({ status: "uploaded" });
});

Deno.serve(app.handler);
```

### Different Limits for Different Routes

Apply different limits to different endpoints by using middleware selectively:

```typescript
import { MageApp } from "@mage/app";
import { bodySize } from "@mage/body-size";

const app = new MageApp();

// Strict limit for API endpoints (1MB)
app.post("/api/submit", bodySize({ maxSize: 1024 * 1024 }), async (c) => {
  const data = await c.req.json();
  return c.json({ received: true });
});

// Generous limit for file uploads (500MB)
app.post(
  "/uploads/large-file",
  bodySize({ maxSize: 500 * 1024 * 1024 }),
  async (c) => {
    const file = await c.req.formData();
    return c.json({ received: true });
  },
);

Deno.serve(app.handler);
```

## Security Considerations

Protects against memory exhaustion DoS attacks by rejecting oversized requests
before reading body.

**Limitations**: Doesn't check if `Content-Length` header is missing. Doesn't
protect against slowloris (use timeout middleware).

**Best practices**: Pair with timeout middleware, log 413 responses, validate
parsed data size after parsing.

## Notes

- Invalid `maxSize` throws error immediately
- Returns 413 with descriptive message when limit exceeded
- Header-based check only (doesn't stream-validate)

## Related

- [Middleware System](/core/middleware) - How middleware works and how to
  compose it
- [Request Timeouts](/middleware/timeout) - Prevent slow DoS attacks
- [Security Headers](/middleware/security-headers) - Additional security
  middleware
