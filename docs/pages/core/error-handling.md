---
title: "Error Handling"
description: "Error handling with MageError and custom error middleware"
---

# Error Handling

Mage provides structured error handling through the `MageError` class. Throw
errors from anywhere in your request handling, and Mage automatically converts
them to appropriate HTTP responses.

## Quick Start

```typescript
import { MageApp, MageError } from "@mage/app";

const app = new MageApp();

app.get("/users/:id", async (c) => {
  const user = await db.findUser(c.req.params.id);

  if (!user) {
    throw new MageError("User not found", 404);
  }

  return c.json(user);
});

Deno.serve(app.handler);
```

## MageError

`MageError` extends JavaScript's `Error` class and adds an HTTP status code.

```typescript
new MageError(message: string, status?: number, options?: ErrorOptions)
```

**Parameters:**

- `message` - Error message
- `status` - HTTP status code (defaults to 500)
- `options` - Standard `ErrorOptions` (includes `cause` for error chaining)

**Properties:**

- `message` - The error message
- `status` - The HTTP status code
- `name` - Always "MageError"

## Throwing Errors

You can throw `MageError` from handlers, middleware, or any function called
during request handling.

### In Handlers

```typescript
import { MageApp, MageError } from "@mage/app";

const app = new MageApp();

app.post("/users", async (c) => {
  const body = await c.req.json();

  if (!body.email) {
    throw new MageError("Email is required", 400);
  }

  if (await db.emailExists(body.email)) {
    throw new MageError("Email already exists", 409);
  }

  const user = await db.createUser(body);
  return c.json(user, 201);
});
```

### In Middleware

```typescript
import { MageApp, MageError } from "@mage/app";

const app = new MageApp();

const requireAuth = async (c, next) => {
  const token = c.req.header("Authorization");

  if (!token) {
    throw new MageError("Unauthorized", 401);
  }

  const user = await validateToken(token);
  c.set("user", user);

  await next();
};

app.get("/admin", requireAuth, (c) => {
  return c.json({ admin: true });
});
```

### In Helper Functions

```typescript
async function getUser(id: string) {
  const user = await db.findUser(id);

  if (!user) {
    throw new MageError("User not found", 404);
  }

  return user;
}

app.get("/users/:id", async (c) => {
  const user = await getUser(c.req.params.id);
  return c.json(user);
});
```

## Automatic Error Handling

MageApp automatically catches errors and converts them to HTTP responses:

- **MageError instances** - Returns the error's status code and message
- **Other errors** - Returns 500 Internal Server Error with generic message

```typescript
import { MageApp, MageError } from "@mage/app";

const app = new MageApp();

app.get("/error-example", () => {
  throw new MageError("Something went wrong", 400);
  // MageApp automatically returns:
  // HTTP 400 Bad Request
  // Body: "Something went wrong"
});

app.get("/unexpected-error", () => {
  throw new Error("Unexpected!");
  // MageApp automatically returns:
  // HTTP 500 Internal Server Error
  // Body: "Internal Server Error"
});

Deno.serve(app.handler);
```

This automatic handling works for errors thrown anywhere in the request
lifecycle - handlers, middleware, or helper functions.

## Custom Error Handler Middleware

For more control over error handling (logging, telemetry, custom responses),
register global error handler middleware:

```typescript
import { MageApp, MageError } from "@mage/app";

const app = new MageApp();

// Error handler middleware - register FIRST
app.use(async (c, next) => {
  try {
    await next();
  } catch (error) {
    // Log errors with request context
    console.error("Error:", {
      method: c.req.method,
      path: c.req.url.pathname,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Send to telemetry/monitoring
    // await telemetry.captureError(error, { requestId: c.get("requestId") });

    // Return appropriate response
    if (error instanceof MageError) {
      return c.json({ error: error.message }, error.status);
    }

    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Other middleware and routes
app.get("/", (c) => c.text("Hello!"));

Deno.serve(app.handler);
```

**Important:** Register the error handler middleware **first** in your
application so it wraps all other middleware and routes.

**Use cases for custom error handlers:**

- Logging errors with request context
- Sending errors to monitoring/telemetry services
- Custom error response formats (JSON, XML, etc.)
- Environment-specific responses (detailed errors in dev, generic in prod)
- Error correlation with request IDs

## Error Chaining

Use the `cause` option to chain errors and preserve context:

```typescript
import { MageApp, MageError } from "@mage/app";

async function fetchUserData(id: string) {
  try {
    return await externalApi.getUser(id);
  } catch (error) {
    throw new MageError("Failed to fetch user data", 502, { cause: error });
  }
}

app.get("/users/:id", async (c) => {
  const data = await fetchUserData(c.req.params.id);
  return c.json(data);
});
```

The underlying error is preserved in the `cause` property, useful for debugging
and logging.

## Common Error Patterns

### Not Found (404)

```typescript
app.get("/users/:id", async (c) => {
  const user = await db.findUser(c.req.params.id);

  if (!user) {
    throw new MageError("User not found", 404);
  }

  return c.json(user);
});
```

### Unauthorized (401)

```typescript
const requireAuth = async (c, next) => {
  const token = c.req.header("Authorization");

  if (!token) {
    throw new MageError("Unauthorized", 401);
  }

  await next();
};
```

### Forbidden (403)

```typescript
app.delete("/users/:id", async (c) => {
  const currentUser = c.get("user");
  const targetId = c.req.params.id;

  if (currentUser.id !== targetId && !currentUser.isAdmin) {
    throw new MageError("Forbidden", 403);
  }

  await db.deleteUser(targetId);
  return c.empty(204);
});
```

### Bad Request (400)

```typescript
app.post("/users", async (c) => {
  const body = await c.req.json();

  if (!body.email || !body.email.includes("@")) {
    throw new MageError("Valid email is required", 400);
  }

  const user = await db.createUser(body);
  return c.json(user, 201);
});
```

## Related

- [MageApp](/core/mage-app) - Automatic error handling behavior
- [Middleware](/core/middleware) - Writing middleware that can throw errors
- [MageContext](/core/mage-context) - The context object in error handlers
