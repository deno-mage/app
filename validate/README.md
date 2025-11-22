# validate

Type-safe request validation using a factory function pattern with automatic
type inference.

## Installation

```typescript
import { validator } from "@mage/app/validate";
import { z } from "zod";
```

## Usage

**Single source validation:**

```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { validate, valid } = validator({ json: loginSchema });

app.post("/login", validate, (c) => {
  // valid(c).json is automatically typed as { email: string; password: string }
  const { json } = valid(c);
  c.json({ email: json.email });
});
```

**Multiple source validation:**

```typescript
const idSchema = z.object({ id: z.string().uuid() });
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const { validate, valid } = validator({
  params: idSchema,
  json: userSchema,
});

app.post("/users/:id", validate, (c) => {
  // Both params and json are automatically typed
  const { params, json } = valid(c);
  c.json({ id: params.id, name: json.name, email: json.email });
});
```

**With other middleware:**

```typescript
const { validate, valid } = validator({ json: loginSchema });

app.post("/protected", auth, logging, validate, (c) => {
  const { json } = valid(c);
  c.json(json);
});
```

## API

**Factory Pattern:**

```typescript
const { validate, valid } = validator(config, options?);
app.post(path, validate, (c) => {
  const validated = valid(c);
});
```

**Validation Config:**

Specify which request sources to validate:

| Source   | Description          | Example Data                   |
| -------- | -------------------- | ------------------------------ |
| `json`   | Request body as JSON | `{ "name": "Alice" }`          |
| `form`   | Form data            | `firstName=John&lastName=Doe`  |
| `search` | URL query parameters | `?year=2021&month=01`          |
| `params` | Route parameters     | `/users/:id` → `{ id: "123" }` |

**Validation Options:**

| Option         | Type                                      | Default | Description                           |
| -------------- | ----------------------------------------- | ------- | ------------------------------------- |
| `reportErrors` | `boolean`                                 | `false` | Include validation errors in response |
| `onError`      | `(errors: ValidationError[]) => Response` | -       | Custom error handler                  |

**Error Reporting:**

```typescript
// Simple error reporting
const { validate, valid } = validator(
  { json: userSchema },
  { reportErrors: true },
);

app.post("/users", validate, (c) => {
  const { json } = valid(c);
  c.json(json);
});

// Custom error handler
const { validate: v2, valid: v2Valid } = validator(
  { json: userSchema },
  {
    onError: (errors) => {
      return new Response(
        JSON.stringify({ message: "Validation failed", errors }),
        { status: 422 },
      );
    },
  },
);

app.post("/users", v2, (c) => {
  const { json } = v2Valid(c);
  c.json(json);
});
```

## Notes

- Uses [Standard Schema V1](https://github.com/standard-schema/standard-schema)
  specification (works with Zod, Valibot, ArkType, etc.)
- Type inference is automatic - no manual type annotations needed
- Validated data is readonly to prevent accidental modification
- Validates all sources before returning errors (error accumulation, not
  fail-fast)
- Returns 400 Bad Request by default on validation failure
- Uses unique string-based context storage to avoid key collisions
- Empty config `validator({})` is a no-op but still provides `valid(c)`
- Standard middleware pattern - works with all other Mage middleware
