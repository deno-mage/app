---
title: "Cache Control"
description: "Set HTTP Cache-Control headers to control how browsers and CDNs cache your responses"
layout: article
---

# Cache Control

The Cache-Control middleware sets HTTP caching directives on your responses,
controlling how browsers, CDNs, and proxies cache your content. This is
essential for optimizing performance and managing stale data.

## Quick Start

```typescript
import { MageApp } from "@mage/app";
import { cacheControl } from "@mage/cache-control";

const app = new MageApp();

// Cache responses for 1 hour in browsers and CDNs
app.use(
  cacheControl({
    maxAge: 3600,
    sMaxAge: 3600,
    public: true,
  }),
);

app.get("/api/products", (c) => {
  return c.json({ products: [] });
});

Deno.serve(app.handler);
```

## How It Works

Sets `Cache-Control` HTTP header to control how browsers and CDNs cache
responses. See
[MDN: HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
for directive details.

## Options

| Option                 | Type      | Default | Description                                               |
| ---------------------- | --------- | ------- | --------------------------------------------------------- |
| `maxAge`               | `number`  | -       | Seconds the response can be cached in browsers            |
| `sMaxAge`              | `number`  | -       | Seconds the response can be cached in shared caches (CDN) |
| `noCache`              | `boolean` | -       | Revalidate with origin before using cached response       |
| `noStore`              | `boolean` | -       | Don't cache the response at all                           |
| `noTransform`          | `boolean` | -       | Don't modify the response when caching                    |
| `mustRevalidate`       | `boolean` | -       | Discard stale cache; must fetch fresh                     |
| `proxyRevalidate`      | `boolean` | -       | Like `mustRevalidate` but for shared caches only          |
| `mustUnderstand`       | `boolean` | -       | Only cache if the cache understands these directives      |
| `private`              | `boolean` | -       | Only browser caches can store it                          |
| `public`               | `boolean` | -       | Shared caches (CDN, proxies) can store it                 |
| `immutable`            | `boolean` | -       | Response won't change while fresh                         |
| `staleWhileRevalidate` | `number`  | -       | Seconds to use stale cache while fetching fresh           |
| `staleIfError`         | `number`  | -       | Seconds to use stale cache if origin is unavailable       |

## Examples

### Static Assets (Images, CSS, JavaScript)

Static assets that don't change should be cached aggressively with the
`immutable` directive:

```typescript
app.get(
  "/assets/:path",
  cacheControl({
    maxAge: 31536000, // 1 year
    sMaxAge: 31536000,
    public: true,
    immutable: true,
  }),
  (c) => {
    // Serve static asset
    return c.file(`./assets/${c.req.param("path")}`);
  },
);
```

With `immutable`, browsers trust that the file never changes while fresh,
eliminating revalidation checks.

### API Responses (with Revalidation)

API responses that change frequently should revalidate with the origin:

```typescript
app.get(
  "/api/posts",
  cacheControl({
    maxAge: 300, // 5 minutes in browser
    sMaxAge: 600, // 10 minutes in CDN
    public: true,
    staleWhileRevalidate: 86400, // Use up to 1 day old while refreshing
  }),
  (c) => {
    return c.json({ posts: fetchPosts() });
  },
);
```

This allows the CDN to serve stale content while fetching fresh, improving
perceived performance.

### User-Specific Content (Private Cache)

Content specific to a user should only be cached in their browser:

```typescript
app.get(
  "/account/profile",
  cacheControl({
    maxAge: 300, // 5 minutes
    private: true, // Only browser cache
    noTransform: true, // Prevent compression or modification
  }),
  async (c) => {
    const user = await getCurrentUser(c);
    return c.json(user);
  },
);
```

### Dynamic Content (No Cache)

Highly dynamic content that updates frequently shouldn't be cached:

```typescript
app.get(
  "/api/live-updates",
  cacheControl({
    noStore: true, // Don't cache at all
  }),
  (c) => {
    return c.json({ timestamp: Date.now() });
  },
);
```

### Sensitive Data (No Storage)

Sensitive data like login pages should not be cached:

```typescript
app.post(
  "/login",
  cacheControl({
    noStore: true,
    private: true,
  }),
  async (c) => {
    // Handle login
    return c.json({ success: true });
  },
);
```

## Security Considerations

Never cache sensitive data in shared caches. Use `noStore` or `private` with
short `maxAge` for sensitive endpoints.

## Notes

- Validates conflicting directives (e.g., can't use both `public` and `private`)
- Apply globally with `app.use()` or per-route
- CDN behavior varies—check your CDN's documentation

## Related

- [Request and Response](/core/request-response) - Working with HTTP requests
  and responses
- [Middleware System](/core/middleware) - How middleware works in Mage
- [MDN: HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching) -
  Deep dive on HTTP caching
- [RFC 9111: HTTP Caching](https://tools.ietf.org/html/rfc9111) - Official HTTP
  caching specification
