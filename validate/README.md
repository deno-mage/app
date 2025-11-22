# validate

Type-safe request validation using the builder pattern with automatic type
inference.

## Installation

```typescript
import { MageApp } from "@mage/app";
import { z } from "zod";
```

## Usage

**Single source validation:**

```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

app.post("/login")
  .validate({ json: loginSchema })
  .handle((c) => {
    // c.valid.json is automatically typed as { email: string; password: string }
    const { email, password } = c.valid.json;
    c.json({ success: true });
  });
```

**Multiple source validation:**

```typescript
const idSchema = z.object({ id: z.string().uuid() });
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

app.post("/users/:id")
  .validate({
    params: idSchema,
    json: userSchema,
  })
  .handle((c) => {
    // Both c.valid.params and c.valid.json are automatically typed
    const { id } = c.valid.params;
    const { name, email } = c.valid.json;
    c.json({ id, name, email });
  });
```

**With middleware:**

```typescript
app.post("/protected")
  .validate({ json: loginSchema })
  .handle(
    async (c, next) => {
      // Auth middleware
      await next();
    },
    (c) => {
      // c.valid is still typed here!
      c.json(c.valid.json);
    },
  );
```

## API

**Builder Pattern:**

```typescript
app.post(path)
  .validate(config, options?)
  .handle(...middleware, handler)
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
app.post("/users")
  .validate(
    { json: userSchema },
    { reportErrors: true },
  )
  .handle((c) => {
    c.json(c.valid.json);
  });

// Custom error handler
app.post("/users")
  .validate(
    { json: userSchema },
    {
      onError: (errors) => {
        return new Response(
          JSON.stringify({ message: "Validation failed", errors }),
          { status: 422 },
        );
      },
    },
  )
  .handle((c) => {
    c.json(c.valid.json);
  });
```

## Notes

- Uses [Standard Schema V1](https://github.com/standard-schema/standard-schema)
  specification (works with Zod, Valibot, ArkType, etc.)
- Type inference is automatic - no manual type annotations needed
- `c.valid` and its properties are readonly to prevent accidental modification
- Validates all sources before returning errors (error accumulation, not
  fail-fast)
- Returns 400 Bad Request by default on validation failure
- Supports unlimited middleware without losing type information
- Empty config `validate({})` is a no-op but adds `c.valid` to context
