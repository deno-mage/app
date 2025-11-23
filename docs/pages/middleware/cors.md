---
title: "CORS"
description: "Handle Cross-Origin Resource Sharing requests with proper header configuration"
layout: "article"
---

# CORS

The CORS middleware handles Cross-Origin Resource Sharing by adding the
necessary HTTP headers to your responses. This allows your API to be accessed
from browsers on different origins while maintaining security controls.

## Quick Start

```typescript
import { MageApp } from "@mage/app";
import { cors } from "@mage/cors";

const app = new MageApp();

// Allow requests from a specific origin
app.use(cors({
  origins: "https://example.com",
  credentials: true,
}));

app.get("/api/users", (c) => c.json({ users: [] }));

Deno.serve(app.handler);
```

## How It Works

Handles CORS preflight (OPTIONS) requests and adds `Access-Control-Allow-*`
headers to responses. Use this when your API is accessed from browsers on
different origins.

See [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) for
fundamentals.

## Options

| Option          | Type                | Default     | Description                                                                 |
| --------------- | ------------------- | ----------- | --------------------------------------------------------------------------- |
| `origins`       | `"*"` or `string[]` | `"*"`       | Allowed origins. Use `"*"` for all origins or an array of specific origins  |
| `methods`       | `"*"` or `string[]` | `[]`        | Allowed HTTP methods (e.g., `["GET", "POST", "PUT"]`)                       |
| `headers`       | `string[]`          | `[]`        | Allowed request headers (e.g., `["Content-Type", "Authorization"]`)         |
| `exposeHeaders` | `string[]`          | `[]`        | Headers exposed to the browser (e.g., `["X-Total-Count"]`)                  |
| `credentials`   | `boolean`           | `false`     | Allow credentials (cookies, HTTP auth). Cannot be true with wildcard origin |
| `maxAge`        | `number`            | `undefined` | Cache duration for preflight results in seconds (e.g., `86400` for 1 day)   |

## Examples

### Allow All Origins

```typescript
import { MageApp } from "@mage/app";
import { cors } from "@mage/cors";

const app = new MageApp();

app.use(cors({
  origins: "*",
}));

app.get("/api/data", (c) => c.json({ data: "public" }));
```

Use this for public APIs with no sensitive data.

### Allow Specific Origins

```typescript
import { MageApp } from "@mage/app";
import { cors } from "@mage/cors";

const app = new MageApp();

app.use(cors({
  origins: [
    "https://example.com",
    "https://app.example.com",
  ],
  credentials: true,
}));

app.get("/api/protected", (c) => c.json({ secret: "data" }));
```

Use this for APIs that serve specific frontend applications.

### Allow All Methods and Custom Headers

```typescript
import { MageApp } from "@mage/app";
import { cors } from "@mage/cors";

const app = new MageApp();

app.use(cors({
  origins: "https://app.example.com",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  headers: ["Content-Type", "Authorization", "X-Custom-Header"],
}));

app.post("/api/users", (c) => c.json({ created: true }, 201));
```

### Expose Custom Response Headers

```typescript
import { MageApp } from "@mage/app";
import { cors } from "@mage/cors";

const app = new MageApp();

app.use(cors({
  origins: "https://app.example.com",
  methods: ["GET"],
  exposeHeaders: ["X-Total-Count", "X-Page-Number"],
}));

app.get("/api/users", (c) => {
  c.header("X-Total-Count", "100");
  c.header("X-Page-Number", "1");
  return c.json({ users: [] });
});
```

By default, browsers only expose standard headers like `Content-Type` and
`Content-Length`. Use `exposeHeaders` to make custom headers available to
JavaScript code in the browser.

### Cache Preflight Responses

```typescript
import { MageApp } from "@mage/app";
import { cors } from "@mage/cors";

const app = new MageApp();

app.use(cors({
  origins: "https://app.example.com",
  methods: ["GET", "POST"],
  headers: ["Content-Type"],
  maxAge: 86400, // Cache for 1 day
}));

app.post("/api/data", (c) => c.json({ saved: true }));
```

Browsers cache preflight results for the specified duration. This reduces
network overhead for repeated requests.

## Security Considerations

### Wildcard Origins with Credentials

**Never** use wildcard origins with credentials enabled:

```typescript
// ❌ This will throw an error
app.use(cors({
  origins: "*",
  credentials: true, // CORS spec violation!
}));
```

The CORS specification forbids this because it would allow any website to access
user credentials. The middleware validates this and throws an error immediately.

### Specific Origins Are More Secure

```typescript
// ✅ More secure - only allow your frontend
app.use(cors({
  origins: ["https://app.example.com"],
  credentials: true,
}));

// ❌ Less secure - allows any origin with credentials
app.use(cors({
  origins: "*",
  credentials: false, // Still not ideal
}));
```

Always specify exact origins when possible. This prevents malicious sites from
accessing your API.

### Always Validate on the Server

CORS headers don't protect you from requests originating outside the browser:

```typescript
// ✅ Good - validate on the server
app.use(cors({ origins: "https://app.example.com" }));

app.post("/api/transfer", async (c) => {
  // Still validate the user is authenticated
  const token = c.req.header("Authorization");
  const user = await validateToken(token);

  if (!user) {
    throw new MageError("Unauthorized", 401);
  }

  // Proceed with transfer
  return c.json({ transferred: true });
});
```

CORS is a browser security feature, not a server security feature. Server-side
validation is essential.

### Credentials Include Cookies

When `credentials: true`, the browser sends cookies with the request. Only
enable this when necessary:

```typescript
// ✅ Explicit about intent
app.use(cors({
  origins: "https://app.example.com",
  credentials: true, // Will send cookies
}));

// ❌ Might not work with credentials
app.use(cors({
  origins: "*",
  // credentials: undefined implicitly false
}));
```

## Notes

- **Preflight caching:** Browsers automatically cache preflight results. Use
  `maxAge` to control the cache duration.
- **Header removal:** The middleware automatically removes preflight-only
  headers (`Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`) from
  non-OPTIONS responses.
- **Empty responses:** If no handler sets a response body for OPTIONS requests,
  the middleware returns an empty response.
- **Origin header required:** The middleware only validates the origin if the
  `Origin` header is present in the request.
- **Vary header:** When using specific origins (not wildcard), the middleware
  sets the `Vary: Origin` header to tell caches that responses vary by origin.

## Related

- [Middleware](/core/middleware) - How middleware works in Mage
- [MageContext](/core/mage-context) - Request and response context
- [Error Handling](/core/error-handling) - Handling CORS errors
