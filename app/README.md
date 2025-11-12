# app

Core Mage framework - routing, middleware, and request/response handling.

## Installation

```typescript
import {
  MageApp,
  type MageContext,
  MageError,
  type MageMiddleware,
} from "@mage/app";
```

## Usage

```typescript
const app = new MageApp();

app.use((c, next) => {
  console.log(`${c.req.method} ${c.req.url.pathname}`);
  return next();
});

app.get("/", (c) => {
  c.text("Hello World");
});

Deno.serve(app.handler);
```

## API

**`MageApp`**

- `use(...middleware)` - Add global middleware
- `get(path, ...middleware)` - Handle GET requests
- `post(path, ...middleware)` - Handle POST requests
- `put(path, ...middleware)` - Handle PUT requests
- `patch(path, ...middleware)` - Handle PATCH requests
- `delete(path, ...middleware)` - Handle DELETE requests
- `options(path, ...middleware)` - Handle OPTIONS requests
- `head(path, ...middleware)` - Handle HEAD requests
- `all(path, ...middleware)` - Handle all methods
- `handler` - Request handler function

**`MageContext`**

- `req` - MageRequest instance
- `res` - Response object
- `header(name, value)` - Set response header
- `text(body, status?)` - Send text response
- `json(data, status?)` - Send JSON response
- `html(body, status?)` - Send HTML response
- `empty(status?)` - Send empty response (default 204)
- `file(path)` - Send file response
- `redirect(url, status?)` - Redirect (default 307)
- `rewrite(url)` - Rewrite request to another location
- `notFound(text?)` - Send 404 response
- `forbidden(text?)` - Send 403 response
- `webSocket(handler)` - Establish WebSocket connection
- `get<T>(key)` - Get stored context data
- `set(key, value)` - Store context data for request

**`MageRequest`**

- `raw` - Raw Request object
- `method` - HTTP method
- `url` - URL object
- `params` - Route parameters
- `wildcard` - Wildcard route match
- `header(name)` - Get request header
- `searchParam(name)` - Get URL search parameter
- `json()` - Parse JSON body (memoized)
- `text()` - Parse text body (memoized)
- `formData()` - Parse form data (memoized)
- `arrayBuffer()` - Get body as ArrayBuffer (memoized)
- `blob()` - Get body as Blob (memoized)
- `valid<T>(source)` - Get validation result

**`MageError`**

- `new MageError(message, status?)` - Create error with HTTP status code

## Notes

- Request body can only be read once; `MageRequest` memoizes it for multiple
  middleware access
- Middleware executes in order; use `await next()` to pass control to the next
  handler
