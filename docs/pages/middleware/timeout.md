---
title: "Timeout"
description: "Abort requests that take too long to process"
---

# Timeout

The timeout middleware enforces a maximum request duration, automatically
aborting any request that exceeds the configured limit. This prevents slow or
hanging requests from consuming resources and helps maintain consistent
application responsiveness.

## Quick Start

```typescript
import { MageApp } from "@mage/app";
import { timeout } from "@mage/timeout";

const app = new MageApp();

// Abort requests that take longer than 30 seconds
app.use(timeout({ ms: 30000 }));

app.get("/process", async (c) => {
  // This handler must complete within 30 seconds
  const result = await expensiveComputation();
  return c.json(result);
});

Deno.serve(app.handler);
```

## How It Works

Aborts requests that exceed the configured duration. Timer starts when
middleware executes and includes all downstream middleware and handlers. Returns
408 if timeout exceeded. Properly cleans up timers.

## Options

| Option | Type     | Default | Description                                                          |
| ------ | -------- | ------- | -------------------------------------------------------------------- |
| `ms`   | `number` | `30000` | Maximum request duration in milliseconds. Must be a positive number. |

## Examples

### Default Configuration

```typescript
import { MageApp } from "@mage/app";
import { timeout } from "@mage/timeout";

const app = new MageApp();

// Use 30 second default timeout for all requests
app.use(timeout());

app.get("/api/status", (c) => {
  return c.json({ status: "ok" });
});
```

### Custom Timeout

```typescript
import { MageApp } from "@mage/app";
import { timeout } from "@mage/timeout";

const app = new MageApp();

// Use 5 second timeout for quick endpoints
app.use(timeout({ ms: 5000 }));

app.get("/health-check", (c) => {
  return c.text("healthy");
});
```

### Route-Specific Timeouts

```typescript
import { MageApp } from "@mage/app";
import { timeout } from "@mage/timeout";

const app = new MageApp();

// Quick endpoints need fast response
app.get("/api/quick", timeout({ ms: 2000 }), (c) => {
  return c.json({ data: "fast" });
});

// Long-running operations get more time
app.post("/api/batch-process", timeout({ ms: 120000 }), async (c) => {
  const result = await processBatch();
  return c.json(result);
});

// Background jobs may need even longer
app.post("/api/export", timeout({ ms: 300000 }), async (c) => {
  const csv = await generateLargeExport();
  return c.text(csv, "text/csv");
});
```

### Global Timeout with Route Overrides

```typescript
import { MageApp } from "@mage/app";
import { timeout } from "@mage/timeout";

const app = new MageApp();

// Global default: 30 seconds
app.use(timeout({ ms: 30000 }));

// Override for specific routes that need different limits
app.get("/api/webhook", timeout({ ms: 5000 }), (c) => {
  // Webhooks should respond quickly
  return c.json({ received: true });
});

app.post("/api/long-task", timeout({ ms: 120000 }), async (c) => {
  // Long tasks get extended timeout
  const result = await longRunningOperation();
  return c.json(result);
});
```

## Error Handling

When a request exceeds the timeout, the middleware returns a 408 Request Timeout
response with an error message. You can handle this using error middleware or a
catch-all error handler.

### Default Timeout Response

```typescript
// Client receives:
// Status: 408
// Body: [Timeout middleware] Request exceeded timeout of 30000ms
```

### Custom Error Handling

```typescript
import { MageApp } from "@mage/app";
import { timeout } from "@mage/timeout";

const app = new MageApp();

app.use(timeout({ ms: 30000 }));

// Handle timeout errors specifically
app.onError((err, c) => {
  if (err.status === 408) {
    return c.json({ error: "Request took too long. Please try again." }, 408);
  }
  throw err;
});

app.get("/api/search", async (c) => {
  const results = await searchDatabase();
  return c.json(results);
});
```

## Common Patterns

### Slow Requests Detection

```typescript
import { MageApp } from "@mage/app";
import { timeout } from "@mage/timeout";

const app = new MageApp();

app.use((c, next) => {
  const start = Date.now();
  return next().finally(() => {
    const duration = Date.now() - start;
    console.log(`${c.req.method} ${c.req.path} took ${duration}ms`);
  });
});

// Apply timeout to catch requests exceeding threshold
app.use(timeout({ ms: 30000 }));
```

### Different Timeouts for Different Routes

```typescript
import { MageApp } from "@mage/app";
import { timeout } from "@mage/timeout";

const app = new MageApp();

const quickTimeout = timeout({ ms: 5000 });
const normalTimeout = timeout({ ms: 30000 });
const slowTimeout = timeout({ ms: 120000 });

// API routes - fast response required
app.get("/api/users", quickTimeout, (c) => {
  return c.json(users);
});

app.get("/api/posts", quickTimeout, (c) => {
  return c.json(posts);
});

// Admin routes - normal timeout
app.post("/admin/update", normalTimeout, async (c) => {
  await updateAdmin(c.req.body);
  return c.json({ success: true });
});

// Batch operations - extended timeout
app.post("/batch/export", slowTimeout, async (c) => {
  const file = await generateExport();
  return c.text(file);
});
```

### Timeout with Streaming

```typescript
import { MageApp } from "@mage/app";
import { timeout } from "@mage/timeout";

const app = new MageApp();

app.use(timeout({ ms: 60000 }));

// Timeout includes the time to start streaming
app.get("/stream/logs", async (c) => {
  // If this function takes longer than 60 seconds to start,
  // the request will timeout
  const logs = await prepareLogs();

  // Streaming the response itself is included in the timeout
  return c.stream(async (write) => {
    for (const log of logs) {
      await write(`${log}\n`);
    }
  });
});
```

## Validation

The timeout value must be a positive number. Invalid configurations are caught
at middleware creation time.

```typescript
import { timeout } from "@mage/timeout";

// Valid
timeout({ ms: 1000 }); // 1 second
timeout({ ms: 30000 }); // 30 seconds
timeout(); // Default: 30 seconds

// Invalid - throws error
timeout({ ms: 0 }); // Throws: must be positive
timeout({ ms: -1000 }); // Throws: must be positive
```

## Notes

- Place early in middleware chain to cover all downstream handlers
- Measures server processing time (not network latency)
- Use route-specific middleware for different timeout limits per endpoint

## Related

- [Middleware](/core/middleware) - How middleware works in Mage
- [MageContext](/core/mage-context) - Working with requests and responses
- [Error Handling](/core/error-handling) - Handling errors in your application
