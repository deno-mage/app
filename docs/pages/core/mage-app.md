---
title: "MageApp"
description: "The main class for creating and running Mage applications"
---

# MageApp

`MageApp` is the main entry point for creating Mage applications. It wraps a
router and provides methods for registering routes, middleware, and handling
HTTP requests.

## Quick Start

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

app.get("/", (c) => {
  return c.text("Hello, Mage!");
});

Deno.serve(app.handler);
```

## Creating an Instance

Create a new Mage application with optional configuration:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();
```

By default, MageApp uses the `LinearRouter` which is optimized for applications
with fewer than 100 routes. You can provide a custom router implementation:

```typescript
import { MageApp } from "@mage/app";
import { CustomRouter } from "./custom-router.ts";

const app = new MageApp({
  router: new CustomRouter(),
});
```

See [Routing](/core/routing) for details on custom router implementations.

## Route Registration Methods

MageApp provides methods for registering routes and middleware for specific HTTP
methods:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

// GET requests
app.get("/users", (c) => {
  return c.json({ users: [] });
});

// POST requests
app.post("/users", async (c) => {
  const body = await c.req.json();
  return c.json({ id: 1, ...body }, 201);
});

// PUT, DELETE, PATCH, HEAD, OPTIONS also available
app.put("/users/:id", (c) => c.json({ updated: true }));
app.delete("/users/:id", (c) => c.empty(204));
app.patch("/users/:id", (c) => c.json({ patched: true }));
```

Each method accepts either:

- Middleware only: `app.get(middleware)`
- Route pattern + middleware: `app.get("/path", middleware)`
- Route pattern + multiple middleware:
  `app.get("/path", auth, validate, handler)`

See [Routing](/core/routing) for route patterns, parameters, and wildcards.

## Middleware Registration

### Global Middleware

Use `app.use()` to register middleware that runs on every request:

```typescript
import { MageApp } from "@mage/app";
import { cors } from "@mage/cors";
import { requestId } from "@mage/request-id";

const app = new MageApp();

app.use(cors({ origins: "*" }));
app.use(requestId());

app.get("/", (c) => c.text("Hello!"));
```

### All Methods Middleware

Use `app.all()` to register middleware for all HTTP methods on specific routes:

```typescript
import { MageApp } from "@mage/app";
import { bearerAuth } from "@mage/bearer-auth";

const app = new MageApp();

// Apply to all methods on /admin routes
app.all("/admin/*", bearerAuth({ token: "secret" }));

app.get("/admin/users", (c) => c.json({ users: [] }));
app.post("/admin/settings", (c) => c.json({ updated: true }));
```

See [Middleware](/core/middleware) for middleware patterns, execution order, and
custom middleware.

## Handler

The `handler` property is a function that processes incoming requests and
returns responses. Pass it to `Deno.serve()` to start your application:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

app.get("/", (c) => c.text("Hello!"));

// Start the server
Deno.serve(app.handler);
```

Configure the server with options:

```typescript
Deno.serve(
  {
    port: 3000,
    hostname: "0.0.0.0",
  },
  app.handler,
);
```

## Automatic Behavior

MageApp provides several automatic behaviors without configuration.

### OPTIONS Requests

MageApp automatically handles OPTIONS requests for CORS preflight. It returns
the allowed HTTP methods for the requested route:

```typescript
// You define:
app.get("/users", (c) => c.json({ users: [] }));
app.post("/users", (c) => c.json({ created: true }));

// OPTIONS /users automatically returns:
// Allow: GET, POST, OPTIONS
```

### 404 Not Found

When no route matches the request path, MageApp automatically returns a 404 Not
Found response:

```typescript
const app = new MageApp();

app.get("/users", (c) => c.json({ users: [] }));

// GET /unknown → 404 Not Found
```

### 405 Method Not Allowed

When a route pattern matches but the HTTP method doesn't, MageApp returns 405
Method Not Allowed with the allowed methods:

```typescript
const app = new MageApp();

app.get("/users", (c) => c.json({ users: [] }));

// POST /users → 405 Method Not Allowed
// Allow: GET, OPTIONS
```

## Error Handling

MageApp catches errors thrown during request processing. Use `MageError` to
throw HTTP errors:

```typescript
import { MageApp, MageError } from "@mage/app";

const app = new MageApp();

app.get("/users/:id", (c) => {
  const user = findUser(c.req.params.id);

  if (!user) {
    throw new MageError("User not found", 404);
  }

  return c.json(user);
});
```

Errors are converted to HTTP responses with the appropriate status code.
Unhandled errors return 500 Internal Server Error.

See [Error Handling](/core/error-handling) for error handling patterns and best
practices.

## Options

### MageAppOptions

Configuration options when creating a MageApp instance.

| Option   | Type          | Default        | Description                  |
| -------- | ------------- | -------------- | ---------------------------- |
| `router` | `MageRouter?` | `LinearRouter` | Custom router implementation |

## Related

- [Getting Started](/getting-started) - Build your first Mage application
- [Routing](/core/routing) - Route patterns, parameters, and custom routers
- [Middleware](/core/middleware) - Middleware patterns and execution order
- [MageContext](/core/mage-context) - The context object passed to handlers
- [Error Handling](/core/error-handling) - Error handling patterns
