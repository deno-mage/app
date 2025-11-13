# timeout

Middleware for enforcing maximum request duration.

## Installation

```typescript
import { timeout } from "@mage/app/timeout";
```

## Usage

```typescript
app.use(
  timeout({
    ms: 30000, // 30 seconds
  }),
);
```

## Options

| Option | Type     | Default          | Description                    |
| ------ | -------- | ---------------- | ------------------------------ |
| `ms`   | `number` | `30000` (30 sec) | Maximum request duration in ms |

## Notes

- Returns 408 Request Timeout when limit exceeded
- Aborts request processing after timeout
- Prevents hanging requests from consuming resources
- Should be applied early in middleware chain
- Timeout starts when middleware executes, includes all downstream middleware
