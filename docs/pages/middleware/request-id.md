---
title: "Request ID"
description: "Add unique IDs to requests for tracing, logging, and incident investigation"
---

# Request ID

The Request ID middleware adds a unique identifier to each request, enabling you
to track requests across your application logs, distributed systems, and
incident investigations.

## Quick Start

```typescript
import { MageApp } from "@mage/app";
import { requestId } from "@mage/request-id";

const app = new MageApp();

// Add request ID middleware
app.use(requestId());

app.get("/api/users", (c) => {
  const id = c.get("requestId");
  console.log(`[${id}] Fetching users`);
  return c.json({ users: [] });
});

Deno.serve(app.handler);
```

## How It Works

Adds a unique ID to each request. Reuses client-provided ID from `X-Request-ID`
header (for distributed tracing) or generates a new UUID. Stores in context as
`c.get("requestId")` and includes in response header.

Use for logging correlation, distributed tracing, debugging, and security
investigation.

## Options

| Option       | Type           | Default               | Description                                                     |
| ------------ | -------------- | --------------------- | --------------------------------------------------------------- |
| `generator`  | `() => string` | `crypto.randomUUID()` | Function to generate request IDs when clients don't provide one |
| `headerName` | `string`       | `"X-Request-ID"`      | HTTP header name for reading and writing request IDs            |

## Examples

### Default Configuration

The simplest setup generates UUIDs and uses the standard header:

```typescript
import { MageApp } from "@mage/app";
import { requestId } from "@mage/request-id";

const app = new MageApp();

app.use(requestId());

app.post("/api/orders", (c) => {
  const id = c.get("requestId");
  console.log(`Processing order with request ID: ${id}`);
  return c.json({ orderId: "123", requestId: id });
});

Deno.serve(app.handler);
```

### Custom Header Name

Some systems use different header conventions. Configure the header name to
match your infrastructure:

```typescript
app.use(
  requestId({
    headerName: "X-Trace-ID",
  }),
);

app.get("/api/data", (c) => {
  const id = c.get("requestId");
  return c.json({ data: [], traceId: id });
});
```

### Custom ID Generator

For debugging or to match existing ID formats, provide a custom generator
function:

```typescript
let requestCounter = 0;

app.use(
  requestId({
    generator: () => {
      const timestamp = Date.now();
      const counter = ++requestCounter;
      return `req-${timestamp}-${counter}`;
    },
  }),
);

app.get("/api/status", (c) => {
  const id = c.get("requestId");
  // id will be formatted like: req-1700000000000-1
  return c.json({ status: "ok", requestId: id });
});
```

### Client-Provided IDs

Clients can send their own request IDs, which the server reuses. This is
essential for distributed tracing:

```typescript
// Client sends a request with a custom ID
// Request headers: { "X-Request-ID": "user-session-abc123" }

app.use(requestId());

app.get("/api/profile", (c) => {
  const id = c.get("requestId");
  // id === "user-session-abc123"
  return c.json({ name: "Alice", requestId: id });
});

// Response includes: { "X-Request-ID": "user-session-abc123" }
```

### Logging Integration

The request ID becomes most valuable when integrated with your logging system:

```typescript
import { MageApp } from "@mage/app";
import { requestId } from "@mage/request-id";

const app = new MageApp();

app.use(requestId());

// Middleware to include request ID in all logs
app.use((c, next) => {
  const id = c.get("requestId");

  // Create a logger instance with the request ID
  const log = (message: string) => {
    console.log(`[${id}] ${message}`);
  };

  c.set("log", log);
  return next();
});

app.get("/api/users/:id", async (c) => {
  const log = c.get("log");
  const userId = c.req.param("id");

  log(`Fetching user: ${userId}`);
  const user = await db.getUser(userId);
  log(`Found user: ${user.name}`);

  return c.json(user);
});

Deno.serve(app.handler);
```

### Multiple Services with Distributed Tracing

In a microservices architecture, pass the same request ID between services:

```typescript
import { MageApp } from "@mage/app";
import { requestId } from "@mage/request-id";

const app = new MageApp();

app.use(requestId());

app.post("/api/checkout", async (c) => {
  const id = c.get("requestId");

  // Call order service with the same request ID
  const orderResponse = await fetch("http://order-service/api/orders", {
    method: "POST",
    headers: {
      "X-Request-ID": id,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: ["item-1", "item-2"],
    }),
  });

  const order = await orderResponse.json();
  return c.json({ success: true, orderId: order.id, requestId: id });
});

Deno.serve(app.handler);
```

## Security Considerations

Enables audit trails, incident investigation, and compliance logging. Don't
trust client-provided IDs for security decisions—use only for tracing. Avoid PII
in IDs.

## Notes

- Available via `c.get("requestId")` after middleware executes
- Reuses client ID if provided (enables distributed tracing)
- Place early in middleware chain

## Related

- [Middleware System](/core/middleware) - Learn how middleware works in Mage
- [Request and Response](/core/request-response) - Understanding context and
  headers
- [Logging Best Practices](https://12factor.net/logs) - Structured logging in
  production applications
- [Distributed Tracing](https://opentelemetry.io/docs/concepts/observability-primer/) -
  Building observable systems with request IDs
