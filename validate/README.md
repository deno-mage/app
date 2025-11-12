# validate

Middleware for validating requests using Standard Schema.

## Installation

```typescript
import { validate } from "@mage/app/validate";
import { z } from "zod";
```

## Usage

```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

app.post("/login", validate("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid<{ email: string; password: string }>(
    "json",
  );
  // email and password are now type-safe and validated
  c.json({ success: true });
});
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
