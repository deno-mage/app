# compression

Middleware for gzip compression of response bodies.

## Installation

```typescript
import { compression } from "@mage/app/compression";
```

## Usage

```typescript
app.use(
  compression({
    threshold: 1024,
    maxSize: 10485760,
  }),
);
```

## Options

| Option         | Type       | Default                         | Description                                      |
| -------------- | ---------- | ------------------------------- | ------------------------------------------------ |
| `threshold`    | `number`   | `1024`                          | Minimum response size (bytes) to compress        |
| `maxSize`      | `number`   | `10485760` (10MB)               | Maximum response size to compress (prevents OOM) |
| `contentTypes` | `string[]` | text/\*, application/json, etc. | Content types to compress                        |

## Notes

- Only compresses if client sends `Accept-Encoding: gzip`
- Only uses compressed version if it's actually smaller
- In production, compression is typically handled by CDN/reverse proxy (nginx,
  Cloudflare)
- Use this middleware for development, self-hosted deployments, or Deno Deploy
