# body-size

Middleware for limiting request body size to prevent DoS attacks.

## Installation

```typescript
import { bodySize } from "@mage/app/body-size";
```

## Usage

```typescript
app.use(
  bodySize({
    maxSize: 1048576, // 1MB
  }),
);
```

## Options

| Option    | Type     | Default         | Description                |
| --------- | -------- | --------------- | -------------------------- |
| `maxSize` | `number` | `1048576` (1MB) | Maximum body size in bytes |

## Notes

- Checks `Content-Length` header for fast rejection before body parsing
- Returns 413 Payload Too Large when limit exceeded
- Protects against memory exhaustion and DoS attacks
- Should be applied early in middleware chain
