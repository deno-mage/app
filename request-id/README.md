# request-id

Middleware for adding unique request IDs to each request for tracing and audit
logging.

## Installation

```typescript
import { requestId } from "@mage/app/request-id";
```

## Usage

```typescript
import { requestId } from "@mage/app/request-id";

// Default configuration (generates UUIDs)
app.use(requestId());

// Access request ID in handlers
app.get("/", (c) => {
  const id = c.get("requestId");
  console.log(`Processing request ${id}`);
  return c.text("OK");
});
```

## Options

| Option       | Type           | Default               | Description                      |
| ------------ | -------------- | --------------------- | -------------------------------- |
| `generator`  | `() => string` | `crypto.randomUUID()` | Function to generate request IDs |
| `headerName` | `string`       | `"X-Request-ID"`      | Header name for request ID       |

## Examples

### Custom Header Name

```typescript
app.use(requestId({
  headerName: "X-Trace-ID",
}));
```

### Custom ID Generator

```typescript
let counter = 0;
app.use(requestId({
  generator: () => `req-${Date.now()}-${++counter}`,
}));
```

### Client-Provided IDs

The middleware will reuse request IDs provided by clients:

```typescript
app.use(requestId());

// Client sends: X-Request-ID: abc123
// Server reuses: abc123
// Context: c.get("requestId") === "abc123"
// Response header: X-Request-ID: abc123
```

### Logging Integration

```typescript
import { requestId } from "@mage/app/request-id";
import { logs } from "@mage/app/logs";

app.use(requestId());
app.use(logs()); // Logs will include request ID

app.get("/api/users", async (c) => {
  const id = c.get("requestId");
  console.log(`[${id}] Fetching users`);

  const users = await db.getUsers();

  console.log(`[${id}] Returning ${users.length} users`);
  return c.json(users);
});
```

## Notes

- Request IDs are available in context via `c.get("requestId")`
- IDs are added to response headers for client-side correlation
- If client provides a request ID, it is reused (enabling distributed tracing)
- Generated IDs are UUIDs by default (RFC 4122 compliant)
- Should be applied early in middleware chain for consistent availability
- Useful for:
  - Distributed tracing across microservices
  - Correlating logs across multiple systems
  - Security incident investigation
  - Debugging production issues
  - Rate limiting and abuse detection

## Security Benefits

- **Audit Trails**: Correlate security events across requests
- **Incident Response**: Track malicious activity through request IDs
- **Rate Limiting**: Identify and block abusive clients
- **Compliance**: Meet logging requirements for regulated industries
