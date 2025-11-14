# validate

Middleware for validating requests using Standard Schema.

## Installation

```typescript
import { validate } from "@mage/app/validate";
import { z } from "zod";
```

## Usage

**JSON body validation:**

```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

app.post("/login", validate("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid<{ email: string; password: string }>(
    "json",
  );
  c.json({ success: true });
});
```

**Route params validation:**

```typescript
const idSchema = z.object({
  id: z.string().uuid(),
});

app.get("/users/:id", validate("params", idSchema), async (c) => {
  const { id } = c.req.valid<{ id: string }>("params");
  c.json({ userId: id });
});
```

**Query params with error reporting:**

```typescript
const searchSchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

app.get(
  "/search",
  validate("search-params", searchSchema, { reportErrors: true }),
  async (c) => {
    const { q, limit } = c.req.valid<{ q: string; limit: number }>(
      "search-params",
    );
    c.json({ query: q, limit });
  },
);
```

## API

**`validate(source, schema, options?)`**

**Sources:**

- `"json"` - Request body as JSON
- `"form"` - Form data
- `"params"` - Route parameters
- `"search-params"` - URL query parameters

**Options:**

| Option         | Type      | Default | Description                           |
| -------------- | --------- | ------- | ------------------------------------- |
| `reportErrors` | `boolean` | `false` | Include validation errors in response |

## Notes

- Uses Standard Schema specification (works with Zod, Valibot, ArkType, etc.)
- Access validated data with `c.req.valid<T>(source)`
- Returns 400 Bad Request on validation failure
- When `reportErrors: true`, returns detailed error information in response body
- Validation result is type-safe based on your schema
