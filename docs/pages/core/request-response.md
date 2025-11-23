---
title: "Request & Response"
description: "MageRequest and MageResponse wrappers around Web APIs"
layout: "article"
---

# Request & Response

Mage wraps the standard Web API Request and Response objects with `MageRequest`
and `MageResponse`. These wrappers solve specific problems with the standard
APIs while maintaining full compatibility.

## Quick Start

Access the request and response through the context object:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

app.post("/users", async (c) => {
  // Access request data
  const body = await c.req.json();
  const contentType = c.req.header("content-type");
  const id = c.req.searchParam("id");

  // Set response headers
  c.res.headers.set("X-User-Id", "123");

  return c.json({ created: true });
});

Deno.serve(app.handler);
```

## MageRequest

`MageRequest` wraps the standard Request object to solve a fundamental
limitation: request bodies can only be read once.

### Why MageRequest Exists

In the standard Fetch API, reading the request body consumes it:

```typescript
// Standard Request - body can only be read once
const request = new Request(url, { method: "POST", body: json });

await request.json(); // Works
await request.json(); // Error: body already consumed
```

This creates problems in middleware chains where multiple handlers need to
access the body:

```typescript
// Without MageRequest - doesn't work
app.use(async (c, next) => {
  const body = await c.req.raw.json(); // Consumes body
  console.log("Logging:", body);
  await next();
});

app.post("/users", async (c) => {
  const body = await c.req.raw.json(); // Error: already consumed
  return c.json(body);
});
```

MageRequest memoizes body parsing so you can read it multiple times:

```typescript
// With MageRequest - works perfectly
app.use(async (c, next) => {
  const body = await c.req.json(); // First read - parses and memoizes
  console.log("Logging:", body);
  await next();
});

app.post("/users", async (c) => {
  const body = await c.req.json(); // Second read - returns memoized value
  return c.json(body);
});
```

### Body Parsing

MageRequest provides memoized methods for parsing the request body in different
formats:

```typescript
app.post("/api/data", async (c) => {
  // Parse as JSON
  const data = await c.req.json();

  // Parse as text
  const text = await c.req.text();

  // Parse as FormData
  const formData = await c.req.formData();

  // Parse as ArrayBuffer
  const buffer = await c.req.arrayBuffer();

  // Parse as Blob
  const blob = await c.req.blob();

  return c.json({ received: true });
});
```

All parsing methods are memoized. The first call parses the body, subsequent
calls return the cached value:

```typescript
app.post("/users", async (c) => {
  const body1 = await c.req.json(); // Parses body
  const body2 = await c.req.json(); // Returns memoized result
  const body3 = await c.req.json(); // Returns memoized result

  console.log(body1 === body2); // true - same object
});
```

### Accessing Request Data

MageRequest provides convenient access to common request properties:

```typescript
app.get("/users", (c) => {
  // HTTP method
  const method = c.req.method; // "GET"

  // URL object
  const url = c.req.url; // URL instance
  const pathname = url.pathname; // "/users"
  const hostname = url.hostname; // "example.com"

  // Raw Request object
  const raw = c.req.raw; // Standard Request

  return c.json({ method, pathname });
});
```

### Headers

Access request headers using the `header()` method:

```typescript
app.post("/users", async (c) => {
  // Get single header
  const contentType = c.req.header("content-type");
  const authorization = c.req.header("authorization");

  // Headers are case-insensitive
  const accept1 = c.req.header("Accept");
  const accept2 = c.req.header("accept");
  console.log(accept1 === accept2); // true

  // Returns null if header not present
  const custom = c.req.header("x-custom");
  if (custom === null) {
    console.log("Header not present");
  }

  return c.json({ contentType });
});
```

### URL Parameters

Access URL search parameters using the `searchParam()` method:

```typescript
app.get("/search", (c) => {
  // GET /search?q=mage&limit=10

  // Get single parameter
  const query = c.req.searchParam("q"); // "mage"
  const limit = c.req.searchParam("limit"); // "10"

  // Returns null if parameter not present
  const page = c.req.searchParam("page"); // null

  // Access all parameters via URL object
  const allParams = c.req.url.searchParams;
  const tags = allParams.getAll("tag"); // Array of all "tag" values

  return c.json({ query, limit });
});
```

### Route Parameters

Access route parameters matched by the router:

```typescript
app.get("/users/:id", (c) => {
  // GET /users/123

  // Access single parameter
  const userId = c.req.params.id; // "123"

  return c.json({ userId });
});

app.get("/users/:userId/posts/:postId", (c) => {
  // GET /users/123/posts/456

  // Access multiple parameters
  const userId = c.req.params.userId; // "123"
  const postId = c.req.params.postId; // "456"

  return c.json({ userId, postId });
});
```

Parameters are always strings. Parse them if you need numbers or other types:

```typescript
app.get("/users/:id", (c) => {
  const id = parseInt(c.req.params.id, 10);

  if (isNaN(id)) {
    return c.text("Invalid ID", 400);
  }

  return c.json({ id });
});
```

### Wildcard Paths

Access wildcard path segments using the `wildcard` property:

```typescript
app.get("/files/*", (c) => {
  // GET /files/images/photo.jpg

  const path = c.req.wildcard; // "images/photo.jpg"

  return c.json({ path });
});

app.get("/api/v1/*", (c) => {
  // GET /api/v1/users/123/posts

  const resource = c.req.wildcard; // "users/123/posts"

  return c.json({ resource });
});
```

The wildcard property is `undefined` if the route doesn't use a wildcard
pattern.

### MageRequest API Reference

#### Properties

| Property   | Type                        | Description                             |
| ---------- | --------------------------- | --------------------------------------- |
| `raw`      | `Request`                   | Underlying Web API Request object       |
| `url`      | `URL`                       | Parsed URL object                       |
| `method`   | `string`                    | HTTP method (GET, POST, etc.)           |
| `params`   | `{ [key: string]: string }` | Route parameters matched by router      |
| `wildcard` | `string \| undefined`       | Wildcard path segment (if route uses *) |

#### Methods

| Method              | Returns                | Description                          |
| ------------------- | ---------------------- | ------------------------------------ |
| `json()`            | `Promise<unknown>`     | Parse body as JSON (memoized)        |
| `text()`            | `Promise<string>`      | Parse body as text (memoized)        |
| `formData()`        | `Promise<FormData>`    | Parse body as FormData (memoized)    |
| `arrayBuffer()`     | `Promise<ArrayBuffer>` | Parse body as ArrayBuffer (memoized) |
| `blob()`            | `Promise<Blob>`        | Parse body as Blob (memoized)        |
| `header(name)`      | `string \| null`       | Get request header value             |
| `searchParam(name)` | `string \| null`       | Get URL search parameter value       |

## MageResponse

`MageResponse` delays Response object creation until the end of the middleware
chain. This allows middleware to modify headers even after the body has been
set.

### Why MageResponse Exists

In the standard Fetch API, Response objects are immutable once created:

```typescript
// Standard Response - immutable
const response = new Response("Hello", {
  status: 200,
  headers: { "content-type": "text/plain" },
});

// Cannot modify headers after creation
response.headers.set("x-custom", "value"); // Doesn't work
```

This creates problems when middleware needs to add headers after a handler has
returned a response:

```typescript
// Without MageResponse - doesn't work as expected
app.use(async (c, next) => {
  const response = await next();
  // Cannot modify response headers here
  return response;
});

app.get("/", (c) => {
  return new Response("Hello"); // Immutable Response
});
```

MageResponse solves this by storing response state (body, status, headers) and
creating the final Response object only once at the end:

```typescript
// With MageResponse - works perfectly
app.use(async (c, next) => {
  await next();
  // Can modify headers even after handler set body
  c.res.headers.set("x-custom", "value");
});

app.get("/", (c) => {
  return c.text("Hello"); // Sets body, but Response not created yet
});
```

### Setting Response Body

Set the response body using context helper methods or directly:

```typescript
app.get("/users", (c) => {
  // Using helper methods (recommended)
  return c.json({ users: [] });
  return c.text("Hello");
  return c.html("<h1>Hello</h1>");

  // Setting body directly
  c.res.setBody(JSON.stringify({ users: [] }));
  c.res.setStatus(200);
  return; // Returns response set on context
});
```

The response body can be any valid `BodyInit` type:

```typescript
app.get("/data", (c) => {
  // String
  c.res.setBody("Hello");

  // ArrayBuffer
  c.res.setBody(new ArrayBuffer(8));

  // Blob
  c.res.setBody(new Blob(["Hello"]));

  // FormData
  const formData = new FormData();
  formData.append("key", "value");
  c.res.setBody(formData);

  // ReadableStream
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue("Hello");
      controller.close();
    },
  });
  c.res.setBody(stream);

  return;
});
```

### Setting Status Code

Set the response status code and optional status text:

```typescript
app.post("/users", (c) => {
  // Using helper methods
  return c.json({ created: true }, 201);
  return c.text("Not Found", 404);

  // Setting status directly
  c.res.setStatus(201, "Created");
  c.res.setBody(JSON.stringify({ created: true }));
  return;
});
```

Common status codes:

```typescript
app.get("/status", (c) => {
  // Success
  c.res.setStatus(200, "OK"); // Default
  c.res.setStatus(201, "Created");
  c.res.setStatus(204, "No Content");

  // Redirection
  c.res.setStatus(301, "Moved Permanently");
  c.res.setStatus(302, "Found");
  c.res.setStatus(304, "Not Modified");

  // Client errors
  c.res.setStatus(400, "Bad Request");
  c.res.setStatus(401, "Unauthorized");
  c.res.setStatus(403, "Forbidden");
  c.res.setStatus(404, "Not Found");

  // Server errors
  c.res.setStatus(500, "Internal Server Error");
  c.res.setStatus(503, "Service Unavailable");

  return;
});
```

### Modifying Headers

MageResponse maintains mutable headers throughout the middleware chain. You can
set headers before, during, or after setting the response body:

```typescript
app.use(async (c, next) => {
  // Set headers before handler
  c.res.headers.set("x-request-id", "123");

  await next();

  // Set headers after handler
  c.res.headers.set("x-processing-time", "45ms");
});

app.get("/users", (c) => {
  // Set headers in handler
  c.res.headers.set("cache-control", "max-age=3600");

  return c.json({ users: [] });
});
```

Headers remain mutable until the response is finalized:

```typescript
app.use(async (c, next) => {
  c.res.headers.set("x-version", "1.0");

  await next();

  // Can still modify headers
  c.res.headers.set("x-version", "2.0"); // Overwrites previous value
  c.res.headers.append("vary", "accept-encoding");
  c.res.headers.delete("x-debug");
});
```

### External Responses

MageResponse supports external Response objects for file serving, redirects, and
WebSocket upgrades:

```typescript
app.get("/files/:path", (c) => {
  const file = Deno.readFileSync(`./uploads/${c.req.params.path}`);
  const response = new Response(file, {
    headers: { "content-type": "application/octet-stream" },
  });

  // Set external response
  c.res.setExternal(response);

  // Can still add headers
  c.res.headers.set("x-served-by", "mage");

  return;
});
```

When you set an external Response, MageResponse merges headers intelligently:

```typescript
app.get("/download", (c) => {
  // Set headers first
  c.res.headers.set("x-custom", "value");

  // External Response has its own headers
  const response = new Response("data", {
    headers: { "content-type": "text/plain" },
  });

  c.res.setExternal(response);

  // Final response includes both:
  // - x-custom: value (from MageResponse)
  // - content-type: text/plain (from external Response)

  return;
});
```

User-set headers take precedence over external Response headers:

```typescript
app.get("/override", (c) => {
  // Set content-type first
  c.res.headers.set("content-type", "application/json");

  // External Response has different content-type
  const response = new Response("data", {
    headers: { "content-type": "text/plain" },
  });

  c.res.setExternal(response);

  // Final response uses your header:
  // content-type: application/json (user-set header wins)

  return;
});
```

### WebSocket Upgrade

WebSocket upgrades (status 101) are handled specially:

```typescript
app.get("/ws", (c) => {
  const upgrade = Deno.upgradeWebSocket(c.req.raw);

  // Set the upgrade response
  c.res.setExternal(upgrade.response);

  // WebSocket upgrade responses are returned as-is
  // They cannot be cloned or modified

  return;
});
```

### Response Finalization

MageResponse creates the final Response object only once when `finalize()` is
called. This happens automatically at the end of the middleware chain - you
never need to call it manually:

```typescript
// Conceptual flow - MageApp does this internally
async function handler(request: Request): Promise<Response> {
  const context = new MageContext(request);

  // Middleware chain executes
  await runMiddleware(context);

  // Response is finalized once at the end
  return context.res.finalize();
}
```

Finalization creates a single Response object from the accumulated state:

```typescript
app.use(async (c, next) => {
  c.res.headers.set("x-start", "value");
  await next();
  c.res.headers.set("x-end", "value");
});

app.get("/", (c) => {
  c.res.setBody("Hello");
  c.res.setStatus(200);
  c.res.headers.set("content-type", "text/plain");
  return;
});

// When finalize() is called (automatically):
// Creates: new Response("Hello", {
//   status: 200,
//   headers: {
//     "content-type": "text/plain",
//     "x-start": "value",
//     "x-end": "value",
//   }
// })
```

### Checking Response State

Check if a response body has been set:

```typescript
app.use(async (c, next) => {
  await next();

  // Check if handler set a response
  if (!c.res.hasBody()) {
    c.res.setBody("Default response");
    c.res.setStatus(200);
  }
});

app.get("/maybe", (c) => {
  // Might not set a response
  if (Math.random() > 0.5) {
    return c.text("Hello");
  }
  // No response set - middleware will add default
});
```

### MageResponse API Reference

#### Properties

| Property     | Type               | Description                                        |
| ------------ | ------------------ | -------------------------------------------------- |
| `body`       | `BodyInit \| null` | Response body (or external Response body)          |
| `status`     | `number`           | HTTP status code (or external Response status)     |
| `statusText` | `string`           | HTTP status text (or external Response statusText) |
| `headers`    | `Headers`          | Mutable Headers object                             |

#### Methods

| Method                     | Returns    | Description                                      |
| -------------------------- | ---------- | ------------------------------------------------ |
| `setBody(body)`            | `void`     | Set response body (clears external Response)     |
| `setStatus(status, text?)` | `void`     | Set status code and optional status text         |
| `setExternal(response)`    | `void`     | Set external Response (merges headers)           |
| `hasBody()`                | `boolean`  | Check if response body is set                    |
| `finalize()`               | `Response` | Create final Response object (called by MageApp) |

## Notes

**Request body memoization:**

- All body parsing methods cache their results
- The first call parses the body and stores it
- Subsequent calls return the cached value
- Different parsing methods share the same underlying body stream
- Once you parse as JSON, you cannot parse as text (the stream is consumed)

**Response mutability:**

- Headers remain mutable throughout the middleware chain
- Body and status can be changed at any time before finalization
- Setting a new body clears any external Response
- External Response headers are merged, not replaced

**Performance:**

- MageRequest memoization adds minimal overhead (simple cache lookup)
- MageResponse creates a single Response object per request (no object churn)
- Header modifications are in-place (no copying until finalization)

**External Responses:**

- Used for file serving, WebSocket upgrades, and proxying
- Headers are merged intelligently (user headers take precedence)
- WebSocket upgrades (status 101) are returned as-is without modification

## Related

- [MageContext](/core/mage-context) - The context object containing request and
  response
- [Routing](/core/routing) - Route patterns, parameters, and wildcards
- [Middleware](/core/middleware) - Middleware patterns and execution order
