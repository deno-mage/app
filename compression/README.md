# compression

Middleware for gzip compression of response bodies.

## Installation

```typescript
import { compression } from "@mage/app/compression";
```

## Usage

**Basic (default settings):**

```typescript
app.use(compression());
```

**Custom thresholds:**

```typescript
app.use(
  compression({
    threshold: 2048, // Only compress >2KB responses
    maxSize: 5242880, // Limit to 5MB (prevent OOM)
  }),
);
```

**Custom content types:**

```typescript
app.use(
  compression({
    contentTypes: ["text/*", "application/json", "application/xml"],
  }),
);
```

## Options

| Option            | Type       | Default                         | Description                                                   |
| ----------------- | ---------- | ------------------------------- | ------------------------------------------------------------- |
| `threshold`       | `number`   | `1024`                          | Minimum response size (bytes) to compress                     |
| `maxSize`         | `number`   | `10485760` (10MB)               | Maximum response size to compress (prevents OOM)              |
| `bufferThreshold` | `number`   | `1048576` (1MB)                 | Max size to buffer in memory (larger responses use streaming) |
| `contentTypes`    | `string[]` | text/\*, application/json, etc. | Content types to compress                                     |

## Memory Management

This middleware uses a **hybrid compression approach** to balance memory
efficiency with optimal HTTP behavior:

### Buffered Compression (responses < `bufferThreshold`)

- Response is buffered in memory and compressed
- Sets `Content-Length` header for optimal client behavior
- Enables progress bars, range requests, and accurate caching
- **Trade-off:** Uses 2x memory (original + compressed) during compression

### Streaming Compression (responses ≥ `bufferThreshold`)

- Response is compressed as a stream without buffering
- Uses **constant memory** regardless of response size
- Uses chunked transfer encoding (no `Content-Length` header)
- **Trade-off:** No progress indicators or range request support

**Example configuration for memory-constrained environments:**

```typescript
app.use(
  compression({
    bufferThreshold: 512 * 1024, // 512KB - more aggressive streaming
    maxSize: 5 * 1024 * 1024, // 5MB - lower ceiling
  }),
);
```

## Notes

- Only compresses if client sends `Accept-Encoding: gzip`
- Only uses compressed version if it's actually smaller (buffered path only)
- Streaming path always compresses if conditions are met (can't compare sizes
  without buffering)
- In production, compression is typically handled by CDN/reverse proxy (nginx,
  Cloudflare)
- Use this middleware for development, self-hosted deployments, or Deno Deploy
