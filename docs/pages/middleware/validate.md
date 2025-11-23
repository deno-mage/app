---
title: "Validate"
description: "Validate request data with Standard Schema support"
---

# Validate

The Validate middleware validates request data from multiple sources (JSON body,
form data, query parameters, and route parameters) using Standard Schema
validators like Zod, Valibot, or ArkType. It provides fully typed access to
validated data in your handlers.

## Quick Start

```typescript
import { MageApp } from "@mage/app";
import { validator } from "@mage/validate";
import { z } from "zod";

const app = new MageApp();

// Define a schema for the request body
const createUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().min(18),
});

// Create a validator and add it to a route
const { validate, valid } = validator({ json: createUserSchema });

app.post("/users", validate, (c) => {
  const data = valid(c);
  // data is fully typed: { json: { name: string; email: string; age: number } }
  return c.json({ created: true, user: data.json }, 201);
});

Deno.serve(app.handler);
```

## How It Works

The Validate middleware validates request data before your handler runs. You
define schemas for the data sources you want to validate, then access the
validated data in your handler with full type safety.

### Validation Sources

You can validate data from four different sources:

- **`json`** - Request body parsed as JSON
- **`form`** - Form data (multipart/form-data and
  application/x-www-form-urlencoded)
- **`search`** - URL query parameters
- **`params`** - Route parameters (captured from the URL path)

### The Validation Flow

1. Request arrives at the middleware
2. Middleware extracts data from the specified sources
3. Each source is validated against its schema
4. If all sources pass, the validated data is stored in context
5. Your handler runs with access to typed validated data
6. If any source fails validation, an error response is sent (handler never
   runs)

### Type Safety

The validator provides full type inference. TypeScript automatically knows the
shape of validated data:

```typescript
const { valid } = validator({
  json: z.object({ name: z.string(), age: z.number() }),
  search: z.object({ sort: z.enum(["asc", "desc"]) }),
});

app.post("/users", validate, (c) => {
  const data = valid(c);
  // TypeScript knows:
  // data.json has shape: { name: string; age: number }
  // data.search has shape: { sort: "asc" | "desc" }
});
```

### Standard Schema

The validator works with any Standard Schema compatible validator:

- **[Zod](https://zod.dev)** - TypeScript-first validation with a simple,
  chainable API
- **[Valibot](https://valibot.dev)** - Lightweight validation with excellent
  type inference
- **[ArkType](https://arktype.io)** - Concise validation syntax with powerful
  type support

All three have identical behavior with the Validate middleware.

## Options

| Option         | Type                           | Default     | Description                                                                                  |
| -------------- | ------------------------------ | ----------- | -------------------------------------------------------------------------------------------- |
| `reportErrors` | `boolean`                      | `false`     | Return validation errors as JSON in the response body instead of a generic error             |
| `onError`      | `(errors) => Response \| void` | `undefined` | Custom error handler function. Return a Response to send it, or void to use default handling |

## Examples

### Validate JSON Body

```typescript
import { MageApp } from "@mage/app";
import { validator } from "@mage/validate";
import { z } from "zod";

const app = new MageApp();

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
});

const { validate, valid } = validator({ json: productSchema });

app.post("/products", validate, (c) => {
  const { json } = valid(c);
  // json.name, json.price, json.stock are all validated
  return c.json({ created: true, product: json }, 201);
});
```

### Validate Query Parameters

```typescript
import { MageApp } from "@mage/app";
import { validator } from "@mage/validate";
import { z } from "zod";

const app = new MageApp();

const filterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(["name", "price", "-price"]).default("name"),
});

const { validate, valid } = validator({ search: filterSchema });

app.get("/products", validate, (c) => {
  const { search } = valid(c);
  // search.page, search.limit, search.sort are all validated
  return c.json({
    products: [],
    pagination: { page: search.page, limit: search.limit },
  });
});
```

### Validate Route Parameters

```typescript
import { MageApp } from "@mage/app";
import { validator } from "@mage/validate";
import { z } from "zod";

const app = new MageApp();

const idSchema = z.object({
  id: z.string().uuid(),
});

const { validate, valid } = validator({ params: idSchema });

app.get("/users/:id", validate, async (c) => {
  const { params } = valid(c);
  const user = await fetchUser(params.id);
  return c.json(user);
});
```

### Validate Form Data

```typescript
import { MageApp } from "@mage/app";
import { validator } from "@mage/validate";
import { z } from "zod";

const app = new MageApp();

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(10),
  subscribe: z.coerce.boolean().optional(),
});

const { validate, valid } = validator({ form: contactSchema });

app.post("/contact", validate, (c) => {
  const { form } = valid(c);
  // Form data is fully validated and typed
  return c.json({ received: true, email: form.email });
});
```

### Validate Multiple Sources

Validate data from multiple sources in a single validator:

```typescript
import { MageApp } from "@mage/app";
import { validator } from "@mage/validate";
import { z } from "zod";

const app = new MageApp();

const userIdSchema = z.object({
  id: z.string().uuid(),
});

const updateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const filterSchema = z.object({
  fields: z.string().default("*"),
});

const { validate, valid } = validator({
  params: userIdSchema,
  json: updateSchema,
  search: filterSchema,
});

app.patch("/users/:id", validate, async (c) => {
  const { params, json, search } = valid(c);
  // All three sources are validated and typed
  const user = await updateUser(params.id, json, search.fields);
  return c.json(user);
});
```

### Multiple Values for the Same Field

Form data and query parameters can have multiple values for the same field. The
validator automatically coalesces them:

```typescript
// Query: ?tags=javascript&tags=typescript&tags=testing

const tagSchema = z.object({
  tags: z.array(z.string()),
});

const { validate, valid } = validator({ search: tagSchema });

app.get("/filter", validate, (c) => {
  const { search } = valid(c);
  // search.tags is ["javascript", "typescript", "testing"]
  return c.json({ tags: search.tags });
});
```

Form data works the same way:

```typescript
// Form field: name="tags" value="a", name="tags" value="b"

const { validate, valid } = validator({ form: tagSchema });

app.post("/filter", validate, (c) => {
  const { form } = valid(c);
  // form.tags is ["a", "b"]
  return c.json({ tags: form.tags });
});
```

### Detailed Error Reporting

By default, validation errors return a generic 400 error. Enable detailed error
reporting to see what failed:

```typescript
import { MageApp } from "@mage/app";
import { validator } from "@mage/validate";
import { z } from "zod";

const app = new MageApp();

const userSchema = z.object({
  name: z.string(),
  age: z.number().int().min(18),
});

const { validate, valid } = validator(
  { json: userSchema },
  { reportErrors: true }, // Enable detailed errors
);

app.post("/users", validate, (c) => {
  const { json } = valid(c);
  return c.json({ created: true }, 201);
});

// Request with invalid data returns:
// {
//   "errors": [
//     {
//       "source": "json",
//       "issues": [
//         { "code": "invalid_type", "expected": "string", "received": "undefined", "path": ["name"], "message": "Required" },
//         { "code": "too_small", "minimum": 18, "type": "number", "path": ["age"], "message": "Number must be greater than or equal to 18" }
//       ]
//     }
//   ]
// }
```

### Custom Error Handler

Define custom error handling logic:

```typescript
import { MageApp } from "@mage/app";
import { validator } from "@mage/validate";
import { z } from "zod";

const app = new MageApp();

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const { validate, valid } = validator(
  { json: userSchema },
  {
    onError: (errors) => {
      // Format errors however you want
      const formatted = errors.map((e) => ({
        source: e.source,
        count: e.issues.length,
      }));

      return new Response(
        JSON.stringify({
          status: "validation_failed",
          errors: formatted,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    },
  },
);

app.post("/users", validate, (c) => {
  const { json } = valid(c);
  return c.json({ created: true }, 201);
});
```

If `onError` returns `undefined` or `void`, the default error handling is used.

### Compose Validators with Middleware

Validators work like normal middleware and can be composed:

```typescript
import { MageApp } from "@mage/app";
import { validator } from "@mage/validate";
import { z } from "zod";

const app = new MageApp();

const authSchema = z.object({
  apiKey: z.string().min(1),
});

const productSchema = z.object({
  name: z.string(),
  price: z.number().positive(),
});

const { validate: validateAuth, valid: validAuth } = validator({
  search: authSchema,
});

const { validate: validateBody, valid: validBody } = validator({
  json: productSchema,
});

app.post(
  "/products",
  validateAuth, // Check API key first
  validateBody, // Then validate body
  (c) => {
    const auth = validAuth(c);
    const body = validBody(c);

    // Only run if both validations pass
    return c.json({ created: true, product: body.json });
  },
);
```

### Reuse the Same Validator

A validator instance can be safely reused across multiple routes:

```typescript
import { MageApp } from "@mage/app";
import { validator } from "@mage/validate";
import { z } from "zod";

const app = new MageApp();

const idSchema = z.object({
  id: z.string().uuid(),
});

const { validate, valid } = validator({ params: idSchema });

// Safe to reuse the same validator instance
app.get("/users/:id", validate, async (c) => {
  const { params } = valid(c);
  return c.json(await fetchUser(params.id));
});

app.get("/posts/:id", validate, async (c) => {
  const { params } = valid(c);
  return c.json(await fetchPost(params.id));
});

app.delete("/files/:id", validate, async (c) => {
  const { params } = valid(c);
  await deleteFile(params.id);
  return c.json({ deleted: true });
});
```

Each request gets its own isolated validation data through context storage, so
concurrent requests don't interfere.

## Security Considerations

### Always Validate Input

The Validate middleware prevents invalid data from reaching your handler, but
you should still validate sensitive operations:

```typescript
// ✅ Good - validate both the input and the operation
const { validate, valid } = validator({ json: userSchema });

app.post("/transfer", validate, async (c) => {
  const { json } = valid(c);

  // Even with validated data, check business rules
  if (json.amount > user.balance) {
    throw new MageError("Insufficient funds", 400);
  }

  // Proceed with transfer
  await transfer(json.amount);
  return c.json({ transferred: true });
});
```

### Sanitize Form Data

File objects in form data are automatically filtered out (only string values are
validated). To handle files separately:

```typescript
const { validate, valid } = validator({
  form: z.object({ name: z.string() }),
});

app.post("/upload", validate, async (c) => {
  const { form } = valid(c);
  const formData = await c.req.formData();

  // Access files separately
  const file = formData.get("file");
  if (file instanceof File) {
    // Handle file upload
  }

  return c.json({ uploaded: true });
});
```

### Type Safety Prevents Bugs

The validator's type inference prevents entire classes of bugs:

```typescript
const { valid } = validator({
  json: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

app.post("/register", validate, async (c) => {
  const { json } = valid(c);

  // TypeScript prevents accidental typos or wrong types
  const user = await createUser(json.email, json.password);
  // This would be a TypeScript error: json.emial (typo)
  // This would be a TypeScript error: json.name (doesn't exist)
  // This would be a TypeScript error: Number + json.password (type mismatch)

  return c.json({ created: true });
});
```

### Validate on Every Boundary

Always validate user input at API boundaries, not just in one place:

```typescript
// ✅ Good - validate at the boundary
const { validate, valid } = validator({
  json: userSchema,
});

app.post("/users", validate, async (c) => {
  const { json } = valid(c);
  // Safe to use json here
});

// ❌ Bad - relying on client-side validation
app.post("/users", async (c) => {
  const json = await c.req.json();
  // json could be anything
  await createUser(json.name); // Unsafe!
});
```

## Notes

- **Empty config:** Passing an empty configuration object (`{}`) is a no-op that
  just passes control to the next middleware. Useful for conditional validators.
- **Error accumulation:** If multiple sources fail validation, all errors are
  accumulated and reported together (not just the first one).
- **Multi-value handling:** Query parameters and form fields with the same name
  are automatically coalesced into arrays. Single values remain strings.
- **Form files:** File objects in form data are silently filtered out. Only
  string values are included in validation.
- **Context isolation:** Each request gets isolated context, so concurrent
  requests with different data don't interfere.
- **Validator reuse:** You can safely reuse the same validator instance across
  multiple routes.
- **No caching:** Validation runs on every request. For expensive operations,
  consider caching at the application level.

## Related

- [Middleware](/core/middleware) - How middleware works in Mage
- [MageContext](/core/mage-context) - Request and response context
- [Error Handling](/core/error-handling) - How to handle validation errors
- [Standard Schema](https://standardschema.dev) - Learn about Standard Schema
  validators
