---
title: "MageContext"
description: "The context object passed to middleware and handlers"
layout: "article"
---

# MageContext

`MageContext` is the context object passed to every middleware and handler in
Mage. It provides access to the request and response, along with helper methods
for sending responses, setting headers, and sharing data between middleware.

## Quick Start

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id, name: "Alice" });
});

Deno.serve(app.handler);
```

## Request Access

Access the incoming request through `c.req`:

```typescript
app.get("/profile", (c) => {
  const userId = c.req.param("id");
  const authHeader = c.req.header("authorization");
  const userAgent = c.req.header("user-agent");

  return c.json({ userId, userAgent });
});
```

See [MageRequest](/core/mage-request) for the complete request API.

## Response Helpers

MageContext provides helper methods for sending common response types. Each
helper sets the response body, status code, and appropriate Content-Type header.

### Text Responses

Send plain text responses:

```typescript
app.get("/", (c) => {
  return c.text("Hello, World!");
});

app.get("/error", (c) => {
  return c.text("Something went wrong", 500);
});
```

### JSON Responses

Send JSON responses with automatic serialization:

```typescript
app.get("/users", (c) => {
  return c.json({ users: [] });
});

app.post("/users", async (c) => {
  const body = await c.req.json();
  return c.json({ id: 1, ...body }, 201);
});
```

### HTML Responses

Send HTML responses:

```typescript
app.get("/", (c) => {
  return c.html("<h1>Hello, World!</h1>");
});

app.get("/page", (c) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <body><h1>Welcome</h1></body>
    </html>
  `;
  return c.html(html);
});
```

### Empty Responses

Send responses with no body:

```typescript
app.delete("/users/:id", (c) => {
  deleteUser(c.req.param("id"));
  return c.empty(); // 204 No Content
});

app.post("/webhook", (c) => {
  processWebhook(c.req.body());
  return c.empty(202); // 202 Accepted
});
```

### Error Responses

Send common error responses:

```typescript
app.get("/users/:id", (c) => {
  const user = findUser(c.req.param("id"));

  if (!user) {
    return c.notFound("User not found");
  }

  return c.json(user);
});

app.get("/admin", (c) => {
  const isAdmin = checkAdmin(c);

  if (!isAdmin) {
    return c.forbidden("Admin access required");
  }

  return c.json({ data: "secret" });
});
```

## Response Methods Reference

| Method                         | Status | Content-Type     | Description                     |
| ------------------------------ | ------ | ---------------- | ------------------------------- |
| `c.text(body, status?)`        | 200    | text/plain       | Send plain text                 |
| `c.json(body, status?)`        | 200    | application/json | Send JSON                       |
| `c.html(body, status?)`        | 200    | text/html        | Send HTML                       |
| `c.empty(status?)`             | 204    | -                | Send empty response             |
| `c.notFound(text?)`            | 404    | text/plain       | Send 404 Not Found              |
| `c.forbidden(text?)`           | 403    | text/plain       | Send 403 Forbidden              |
| `c.redirect(location, status)` | 307    | -                | Redirect to URL                 |
| `c.rewrite(location)`          | varies | varies           | Proxy request to another URL    |
| `c.file(filepath)`             | varies | auto-detected    | Serve static file               |
| `c.webSocket(handleSocket)`    | 101    | -                | Upgrade to WebSocket connection |

## Header Management

Set response headers using `c.header()`:

```typescript
app.get("/api/data", (c) => {
  c.header("X-Custom-Header", "value");
  c.header("Cache-Control", "max-age=3600");
  return c.json({ data: [] });
});
```

Headers set with `c.header()` are merged with headers set by response helpers:

```typescript
app.get("/", (c) => {
  c.header("X-Request-ID", "123");
  return c.json({ message: "Hello" });
  // Response includes both X-Request-ID and Content-Type: application/json
});
```

## Context Storage

Share data between middleware using `c.set()` and `c.get()`:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

// Middleware stores user in context
app.use(async (c, next) => {
  const token = c.req.header("authorization");
  const user = await validateToken(token);
  c.set("user", user);
  await next();
});

// Handler retrieves user from context
app.get("/profile", (c) => {
  const user = c.get<{ id: string; name: string }>("user");
  return c.json(user);
});
```

Type the stored data for safety:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// Store typed data
c.set("user", user);

// Retrieve with type assertion
const user = c.get<User>("user");
```

**Important:** Context storage is scoped to a single request. Data is not shared
across requests.

## File Serving

Serve static files from the filesystem using `c.file()`:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

app.get("/files/:filename", async (c) => {
  const filename = c.req.param("filename");
  const filepath = `./public/${filename}`;

  try {
    await c.file(filepath);
  } catch {
    return c.notFound("File not found");
  }
});

Deno.serve(app.handler);
```

`c.file()` automatically:

- Detects the correct Content-Type based on file extension
- Sets appropriate caching headers
- Handles range requests for partial content
- Integrates with Deno's optimized file serving

**Security:** Always validate file paths to prevent directory traversal attacks.
Use middleware like `serveFiles` for production file serving with built-in
security.

## Redirects

Redirect requests to a different URL using `c.redirect()`:

```typescript
app.get("/old-path", (c) => {
  return c.redirect("/new-path");
});

app.get("/login", (c) => {
  return c.redirect("https://auth.example.com/login", 302);
});
```

The default redirect status is `307 Temporary Redirect`, which preserves the
HTTP method. Use `302` for traditional redirects that change POST to GET.

## Rewrites

Proxy requests to another URL using `c.rewrite()`:

```typescript
app.get("/api/*", async (c) => {
  // Proxy to backend API
  await c.rewrite("https://backend.example.com" + c.req.path);
});

app.get("/proxy/:path", async (c) => {
  const path = c.req.param("path");
  await c.rewrite(`https://api.example.com/${path}`);
});
```

`c.rewrite()` makes a network request to the target URL and returns the
response. The original request method, headers, and body are forwarded.

**Important:** `c.rewrite()` creates a network request, so it's not optimal for
local path rewrites. Use it for proxying to external services.

Query strings from the original request are preserved:

```typescript
// GET /api/users?limit=10
app.get("/api/*", async (c) => {
  // Rewrites to https://backend.example.com/api/users?limit=10
  await c.rewrite("https://backend.example.com" + c.req.path);
});
```

## WebSocket Support

Upgrade connections to WebSocket using `c.webSocket()`:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

app.get("/ws", (c) => {
  return c.webSocket((socket) => {
    socket.onmessage = (event) => {
      console.log("Received:", event.data);
      socket.send("Echo: " + event.data);
    };

    socket.onclose = () => {
      console.log("Connection closed");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  });
});

Deno.serve(app.handler);
```

If the request is not a WebSocket upgrade request, `c.webSocket()` returns
`501 Not Implemented`.

## Related

- [MageApp](/core/mage-app) - Creating and configuring Mage applications
- [MageRequest](/core/mage-request) - Accessing request data
- [MageResponse](/core/mage-response) - Response internals
- [Middleware](/core/middleware) - Writing and composing middleware
