---
title: "Compression"
description: "Compress response bodies using gzip to reduce bandwidth usage"
layout: "article"
---

# Compression

The compression middleware automatically compresses response bodies using gzip,
reducing bandwidth usage and improving page load times. It intelligently handles
different response sizes with a hybrid buffering approach.

## Quick Start

```typescript
import { MageApp } from "@mage/app";
import { compression } from "@mage/compression";

const app = new MageApp();

app.use(compression());

app.get("/data", (c) => {
  return c.json({ message: "This response will be compressed" });
});

Deno.serve(app.handler);
```

## How It Works

Compresses response bodies with gzip when the client supports it. Only
compresses text-based content types above a threshold size. Small responses (<
1MB) are buffered; large responses stream. Skips compression if the result would
be larger than the original.

**Production note**: Use CDN/reverse proxy compression (nginx, Cloudflare) in
production. This middleware is for development and self-hosted deployments.

## Options

| Option            | Type       | Default           | Description                                                                                                      |
| ----------------- | ---------- | ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| `threshold`       | `number`   | `1024`            | Minimum response size in bytes to compress. Responses smaller than this are sent uncompressed.                   |
| `maxSize`         | `number`   | `10485760` (10MB) | Maximum response size in bytes to compress. Responses larger than this are sent uncompressed for DoS protection. |
| `bufferThreshold` | `number`   | `1048576` (1MB)   | Responses smaller than this are buffered and compressed in memory. Larger responses use streaming compression.   |
| `contentTypes`    | `string[]` | Common text types | Content types to compress (HTML, CSS, JSON, JavaScript, XML, SVG, etc.). Supports wildcards.                     |

## Examples

### Default Configuration

```typescript
import { MageApp } from "@mage/app";
import { compression } from "@mage/compression";

const app = new MageApp();

// Use defaults: threshold 1KB, max 10MB, buffer 1MB
app.use(compression());

app.get("/api/users", (c) => {
  return c.json({ users: [] });
});
```

### Custom Thresholds

```typescript
import { MageApp } from "@mage/app";
import { compression } from "@mage/compression";

const app = new MageApp();

// Only compress responses above 5KB, don't compress over 50MB
app.use(compression({
  threshold: 5 * 1024, // 5KB minimum
  maxSize: 50 * 1024 * 1024, // 50MB maximum
}));

app.get("/api/large", (c) => {
  return c.json({ data: largeDataset });
});
```

### Custom Content Types

```typescript
import { MageApp } from "@mage/app";
import { compression } from "@mage/compression";

const app = new MageApp();

// Compress standard types plus XML and custom formats
app.use(compression({
  contentTypes: [
    "text/html",
    "application/json",
    "application/xml",
    "text/plain",
    "application/custom+json",
  ],
}));

app.get("/api/custom", (c) => {
  c.header("Content-Type", "application/custom+json");
  return c.text('{"custom": true}');
});
```

### Streaming Optimization

```typescript
import { MageApp } from "@mage/app";
import { compression } from "@mage/compression";

const app = new MageApp();

// Aggressively stream large responses without buffering
app.use(compression({
  bufferThreshold: 256 * 1024, // 256KB - stream anything larger
}));

app.get("/large-file", (c) => {
  // This large response will use streaming compression
  return c.json({ size: 5_000_000 });
});
```

## Security Considerations

The `maxSize` option prevents DoS attacks from extremely large responses. The
middleware adds `Vary: Accept-Encoding` for proper caching.

If serving sensitive data in HTML with attacker-controlled content, disable
compression for those responses to avoid BREACH attacks. See
[OWASP: BREACH](https://owasp.org/www-community/attacks/BREACH).

## Notes

- Only compresses string and `Uint8Array` bodies (not streaming
  `ReadableStream`)
- Checks `Accept-Encoding` header before compression
- Deno Deploy handles compression automatically

## Related

- [Middleware](/core/middleware) - How middleware works in Mage
- [MageContext](/core/mage-context) - Setting headers and response bodies
- [Request/Response](/core/request-response) - Understanding request and
  response objects
