# cors

Middleware for handling Cross-Origin Resource Sharing (CORS).

## Installation

```typescript
import { cors } from "@mage/app/cors";
```

## Usage

```typescript
app.use(
  cors({
    origins: ["https://example.com", "https://app.example.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    headers: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  }),
);
```

## Options

| Option          | Type              | Description                        |
| --------------- | ----------------- | ---------------------------------- |
| `origins`       | `"*" \| string[]` | Allowed origins                    |
| `methods`       | `"*" \| string[]` | Allowed HTTP methods               |
| `headers`       | `string[]`        | Allowed request headers            |
| `exposeHeaders` | `string[]`        | Headers exposed to browser         |
| `credentials`   | `boolean`         | Allow credentials (cookies, auth)  |
| `maxAge`        | `number`          | Preflight cache duration (seconds) |

## Notes

- Cannot use wildcard origin (`*`) with `credentials: true` (CORS spec
  violation)
- Automatically handles OPTIONS preflight requests
- Sets `Vary: Origin` header when using specific origins
