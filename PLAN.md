# 🎯 PLAN: Builder Pattern Validation with Full Type Inference

## 🌟 THE VISION

**Instead of:**

```typescript
app.post(
  "/users/:id",
  validate("params", idSchema),
  validate("json", bodySchema),
  async (c) => {
    const { id } = c.req.valid<IdType>("params");
    const { name } = c.req.valid<BodyType>("json");
  },
);
```

**We get:**

```typescript
// Simple routes stay simple (no validation needed)
app.get("/health", (c) => c.text("OK"));
app.post("/webhook", verify, handler);

// Validated routes use fluent builder API
app.post("/users/:id")
  .validate({
    params: idSchema,
    json: bodySchema,
  })
  .handle(auth, logging, (c) => {
    const { id } = c.valid.params; // ✨ Auto-typed!
    const { name } = c.valid.json; // ✨ Auto-typed!
  });
```

---

## 🎯 DESIGN DECISIONS

### 1. Builder Pattern for Type Inference

**The Problem:** TypeScript cannot propagate types through variadic middleware:

```typescript
app.post("/", middleware1, middleware2, handler);
//                        ^^^^^^^^^^^ Can't infer extended context type
```

**The Solution:** Method chaining where each call returns a typed builder:

```typescript
app.post("/users/:id") // Returns RouteBuilder
  .validate({ json: schema }) // Returns ValidatedRouteBuilder<TConfig>
  .handle(m1, m2, m3, (c) => { // Handler gets ValidatedContext<TConfig>
    c.valid.json; // ✨ Fully typed!
  });
```

**Benefits:**

- ✅ Unlimited middleware, full type inference
- ✅ Simple routes stay simple (no validation = no builder needed)
- ✅ Zero manual type annotations
- ✅ TypeScript autocomplete shows only validated sources

### 2. Validation Source Names

**Decision:** No dashes in property names for better DX

- `json` - Request body as JSON
- `form` - Form data (application/x-www-form-urlencoded or multipart/form-data)
- `search` - URL search/query parameters
- `params` - Route/path parameters (e.g., `/users/:id`)

**Why these names:**

- ✅ All valid JavaScript identifiers (dot notation works: `c.valid.search`)
- ✅ Concise and clear
- ✅ Follows common framework conventions (`params` is standard)
- ✅ No bracket notation required

### 3. Readonly Approach

**Decision:** Shallow readonly at two levels

- `c.valid` itself is readonly (cannot reassign the object)
- Individual properties like `c.valid.json` are readonly (cannot reassign)
- Data inside validated objects is mutable (allows
  `c.valid.json.user.name = "foo"`)
- Prevents common mistakes while keeping flexibility

**Implementation:**

```typescript
// Runtime: Object.defineProperty prevents reassignment of c.valid
Object.defineProperty(c, "valid", {
  value: validatedData,
  writable: false,
  enumerable: true,
  configurable: false,
});

// TypeScript: readonly modifier prevents reassignment of individual properties
export type ValidatedData<TConfig extends ValidationConfig> = {
  readonly [K in keyof TConfig]: TConfig[K] extends StandardSchemaV1
    ? InferOutput<TConfig[K]>
    : never;
};
```

### 4. Error Handling Strategy

**Decision:** Accumulate errors from all sources

- Validate ALL sources even if some fail
- Collect all validation errors
- Return comprehensive error response showing all issues
- Better DX: users fix everything at once, not one-by-one

**Example error response:**

```json
{
  "errors": [
    {
      "source": "params",
      "issues": [{ "path": ["id"], "message": "Invalid UUID" }]
    },
    {
      "source": "json",
      "issues": [{ "path": ["email"], "message": "Invalid email" }]
    }
  ]
}
```

### 5. Empty Config Behavior

**Decision:** No-op validation

```typescript
app.post("/test")
  .validate({}) // No validation, but c.valid exists as {}
  .handle((c) => {
    // c.valid is empty object
  });
```

- Doesn't throw error
- Allows conditional composition:
  `.validate(someCondition ? { json: schema } : {})`
- `c.valid` will be an empty object `{}`

### 6. Simple Routes Stay Simple

**Decision:** No builder required when validation not needed

```typescript
// These still work exactly as before
app.get("/", (c) => c.text("Hello"));
app.post("/", auth, handler);
app.post("/", auth, logging, rateLimit, handler);
```

Only use builder when you need validation:

```typescript
app.post("/")
  .validate({ json: schema })
  .handle((c) => { ... })
```

---

## 📐 ARCHITECTURE

### Type System

```typescript
// validate/types.ts

import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { MageContext } from "../app/context.ts";

/**
 * Validation sources for request data.
 */
export type ValidationSource = "json" | "form" | "search" | "params";

/**
 * Extract the output type from a Standard Schema.
 */
export type InferOutput<T extends StandardSchemaV1> = T extends
  StandardSchemaV1<infer _In, infer Out> ? Out : never;

/**
 * Validation configuration object mapping sources to schemas.
 */
export type ValidationConfig = {
  [K in ValidationSource]?: StandardSchemaV1;
};

/**
 * Build validated data type from config.
 * Properties are readonly to prevent reassignment.
 */
export type ValidatedData<TConfig extends ValidationConfig> = {
  readonly [K in keyof TConfig]: TConfig[K] extends StandardSchemaV1
    ? InferOutput<TConfig[K]>
    : never;
};

/**
 * Extended context with validated data.
 */
export type ValidatedContext<TConfig extends ValidationConfig> =
  & MageContext
  & {
    readonly valid: ValidatedData<TConfig>;
  };

/**
 * Options for validation.
 */
export interface ValidateOptions {
  /** Report detailed validation errors in response (default: false) */
  reportErrors?: boolean;
  /** Custom error handler - receives all accumulated errors */
  onError?: (errors: ValidationError[]) => Response | void;
}

/**
 * Validation error for a single source.
 */
export interface ValidationError {
  source: ValidationSource;
  issues: readonly unknown[];
}
```

### Route Builder Classes

```typescript
// app/route-builder.ts

import type { MageContext } from "./context.ts";
import type { MageMiddleware } from "./router.ts";
import type {
  ValidatedContext,
  ValidateOptions,
  ValidationConfig,
} from "../validate/types.ts";

/**
 * Builder for non-validated routes.
 * Returned by app.get(), app.post(), etc.
 */
export class RouteBuilder {
  constructor(
    private router: MageRouter,
    private method: string,
    private path: string,
  ) {}

  /**
   * Add validation to this route.
   * Returns a ValidatedRouteBuilder with typed context.
   */
  validate<TConfig extends ValidationConfig>(
    config: TConfig,
    options?: ValidateOptions,
  ): ValidatedRouteBuilder<TConfig> {
    return new ValidatedRouteBuilder(
      this.router,
      this.method,
      this.path,
      config,
      options,
    );
  }

  /**
   * Register handler and middleware for this route (no validation).
   */
  handle(
    ...middleware: [
      ...MageMiddleware[],
      (c: MageContext) => void | Promise<void>,
    ]
  ): void {
    // Register route with router
    // Handler gets MageContext (no validation)
  }
}

/**
 * Builder for validated routes.
 * Handler receives ValidatedContext<TConfig> with typed c.valid property.
 */
export class ValidatedRouteBuilder<TConfig extends ValidationConfig> {
  constructor(
    private router: MageRouter,
    private method: string,
    private path: string,
    private config: TConfig,
    private options?: ValidateOptions,
  ) {}

  /**
   * Register handler and middleware for this validated route.
   * Handler receives ValidatedContext with typed c.valid property.
   */
  handle(
    ...middleware: [
      ...MageMiddleware[],
      (c: ValidatedContext<TConfig>) => void | Promise<void>,
    ]
  ): void {
    // Create validation middleware from config
    // Register route with validation middleware + user middleware + handler
    // Handler gets ValidatedContext<TConfig>
  }
}
```

### Validation Logic

```typescript
// validate/validator.ts

import type { MageContext } from "../app/mod.ts";
import type {
  ValidateOptions,
  ValidationConfig,
  ValidationError,
} from "./types.ts";
import { extractSourceData } from "./extractors.ts";

/**
 * Perform validation and extend context with validated data.
 *
 * This is used internally by ValidatedRouteBuilder.
 * Returns true if validation passed, false otherwise.
 */
export async function performValidation(
  c: MageContext,
  config: ValidationConfig,
  options?: ValidateOptions,
): Promise<boolean> {
  // Empty config = no-op
  if (Object.keys(config).length === 0) {
    Object.defineProperty(c, "valid", {
      value: {},
      writable: false,
      enumerable: true,
      configurable: false,
    });
    return true;
  }

  const validated: Record<string, unknown> = {};
  const errors: ValidationError[] = [];

  // Validate each source (accumulate errors)
  for (const [source, schema] of Object.entries(config)) {
    const sourceKey = source as ValidationSource;

    try {
      const data = await extractSourceData(c, sourceKey);
      const result = await schema["~standard"].validate(data);

      if (result.issues) {
        errors.push({ source: sourceKey, issues: result.issues });
      } else {
        validated[sourceKey] = result.value;
      }
    } catch (error) {
      errors.push({
        source: sourceKey,
        issues: [{
          message: error instanceof Error ? error.message : "Extraction failed",
        }],
      });
    }
  }

  // Handle validation failures
  if (errors.length > 0) {
    if (options?.onError) {
      const response = options.onError(errors);
      if (response) {
        c.res.setExternal(response);
        return false;
      }
    }

    if (options?.reportErrors) {
      c.json({ errors }, 400);
      return false;
    }

    const sources = errors.map((e) => e.source).join(", ");
    throw new MageError(
      `[Validation] Validation failed for: ${sources}`,
      400,
    );
  }

  // Success - extend context
  Object.defineProperty(c, "valid", {
    value: validated,
    writable: false,
    enumerable: true,
    configurable: false,
  });

  return true;
}
```

### Data Extractors

```typescript
// validate/extractors.ts

import type { MageContext } from "../app/mod.ts";
import type { ValidationSource } from "./types.ts";
import { MageError } from "../app/mod.ts";

/**
 * Coalesce multi-value form/search params into arrays.
 */
const coalesceMultiValues = (
  entries: Iterable<[string, string]>,
): Record<string, string | string[]> => {
  const values = new Map<string, string | string[]>();

  for (const [key, value] of entries) {
    const existing = values.get(key);
    if (existing === undefined) {
      values.set(key, value);
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      values.set(key, [existing, value]);
    }
  }

  return Object.fromEntries(values);
};

/**
 * Extract data from request based on validation source.
 */
export const extractSourceData = async (
  c: MageContext,
  source: ValidationSource,
): Promise<unknown> => {
  switch (source) {
    case "json": {
      return await c.req.json();
    }

    case "form": {
      const formData = await c.req.formData();
      const stringEntries: Array<[string, string]> = [];
      formData.forEach((value, key) => {
        if (typeof value === "string") {
          stringEntries.push([key, value]);
        }
      });
      return coalesceMultiValues(stringEntries);
    }

    case "params": {
      return c.req.params;
    }

    case "search": {
      return coalesceMultiValues(c.req.url.searchParams.entries());
    }

    default: {
      throw new MageError(`[Validation] Invalid source: ${source}`);
    }
  }
};
```

### Updated MageApp Methods

```typescript
// app/app.ts

export class MageApp {
  // ... existing code ...

  /**
   * Register middleware for POST requests.
   * Returns a RouteBuilder for adding validation.
   */
  public post(path: string): RouteBuilder;
  public post(
    path: string,
    ...middleware: [
      ...MageMiddleware[],
      (c: MageContext) => void | Promise<void>,
    ]
  ): void;
  public post(
    path: string,
    ...middleware: [
      ...MageMiddleware[],
      (c: MageContext) => void | Promise<void>,
    ]
  ): RouteBuilder | void {
    // If no middleware, return builder
    if (middleware.length === 0) {
      return new RouteBuilder(this._router, "POST", path);
    }

    // Otherwise register directly
    this._router.post(path, ...middleware);
  }

  // Same pattern for get(), put(), delete(), patch(), etc.
}
```

---

## 📂 FILE STRUCTURE

```
validate/
├── mod.ts              # Public exports
├── types.ts            # NEW: Type definitions
├── validator.ts        # NEW: Core validation logic
├── extractors.ts       # NEW: Data extraction logic
├── README.md           # UPDATED: New documentation
└── tests/
    └── validate.test.ts # UPDATED: Tests for new API

app/
├── route-builder.ts    # NEW: RouteBuilder and ValidatedRouteBuilder classes
├── app.ts              # UPDATED: Return builders from route methods
├── request.ts          # UPDATED: Remove validation methods
├── context.ts          # No changes needed
└── mod.ts              # UPDATED: Export route builders
```

---

## 📋 IMPLEMENTATION TASKS

### Phase 1: Foundation

1. **Create validate/types.ts** with new type system
   - `ValidationConfig`, `ValidatedData`, `ValidatedContext`
   - `InferOutput`, `ValidationError`
   - `ValidateOptions`
   - Include `readonly` modifier on `ValidatedData` properties

2. **Create validate/extractors.ts** with data extraction logic
   - `coalesceMultiValues` helper
   - `extractSourceData` function
   - Support all 4 sources: json, form, search, params

3. **Create validate/validator.ts** with core validation logic
   - `performValidation` function
   - Error accumulation
   - Context extension with `c.valid`
   - Handle empty config as no-op

4. **Create app/route-builder.ts** with builder classes
   - `RouteBuilder` class (non-validated routes)
   - `ValidatedRouteBuilder<TConfig>` class (validated routes)
   - `.validate()` method to transition from RouteBuilder to
     ValidatedRouteBuilder
   - `.handle()` method on both builders

5. **Update validate/mod.ts** exports
   - Export all types
   - Export `performValidation` for internal use
   - Remove old middleware-based validate function

### Phase 2: Integration

6. **Update app/app.ts** route methods
   - Overload `get()`, `post()`, `put()`, etc. to return `RouteBuilder` when no
     middleware
   - Keep existing signature for direct registration
   - Import and use `RouteBuilder`

7. **Update app/mod.ts**
   - Export `RouteBuilder` and `ValidatedRouteBuilder`
   - Export validation types for advanced usage

### Phase 3: Cleanup

8. **Remove validation from app/request.ts**
   - Remove `valid<TResult>(source)` method
   - Remove `setValidationResult<TResult>()` method
   - Remove `_validationResults` Map
   - Remove `ValidationSource` type import

9. **Update linear-router** if needed
   - Ensure it works with builder pattern
   - No changes should be needed (builders call existing router methods)

### Phase 4: Testing & Documentation

10. **Write comprehensive tests** for new API
    - RouteBuilder basic usage
    - ValidatedRouteBuilder with single source
    - ValidatedRouteBuilder with multiple sources
    - Unlimited middleware count
    - Error accumulation
    - Error reporting options
    - Custom error handler
    - Empty config behavior
    - Type safety tests

11. **Update validate/README.md**
    - New builder API examples
    - Migration guide from old API
    - Advanced usage patterns
    - Type inference examples

12. **Final verification**
    - Run full test suite
    - Run linter
    - Test build
    - Manual testing with real schemas

---

## 🎨 USAGE EXAMPLES

### Simple Routes (No Validation)

```typescript
// Unchanged - no builder needed
app.get("/health", (c) => c.text("OK"))
app.post("/webhook", verifySignature, (c) => { ... })
app.post("/upload", auth, logging, rateLimit, (c) => { ... })
```

### Single Source Validation

```typescript
app.post("/login")
  .validate({ json: loginSchema })
  .handle((c) => {
    const { email, password } = c.valid.json; // ✨ Auto-typed!
    // ...
  });
```

### Multiple Source Validation

```typescript
app.post("/users/:id")
  .validate({
    params: z.object({ id: z.string().uuid() }),
    json: z.object({ name: z.string(), email: z.string().email() }),
    search: z.object({ notify: z.boolean().optional() }),
  })
  .handle((c) => {
    const { id } = c.valid.params; // ✨ Auto-typed!
    const { name, email } = c.valid.json; // ✨ Auto-typed!
    const { notify } = c.valid.search; // ✨ Auto-typed!
    // ...
  });
```

### With Middleware (Unlimited!)

```typescript
app.post("/users/:id")
  .validate({
    params: idSchema,
    json: bodySchema,
  })
  .handle(
    auth,
    logging,
    rateLimit,
    cors,
    monitoring,
    // ... unlimited middleware ...
    (c) => {
      c.valid.params; // ✨ Still fully typed!
      c.valid.json; // ✨ Still fully typed!
    },
  );
```

### Error Reporting

```typescript
app.post("/users")
  .validate(
    { json: userSchema },
    { reportErrors: true }  // Return detailed errors
  )
  .handle((c) => { ... })
```

### Custom Error Handler

```typescript
app.post("/users")
  .validate(
    { json: userSchema },
    {
      onError: (errors) => {
        return new Response(
          JSON.stringify({
            success: false,
            errors: errors.map(e => ({
              source: e.source,
              issues: e.issues,
            })),
          }),
          { status: 400 }
        );
      },
    }
  )
  .handle((c) => { ... })
```

### Conditional Validation

```typescript
const config = isDevelopment
  ? { json: strictSchema, search: debugSchema }
  : { json: relaxedSchema };

app.post("/api")
  .validate(config)
  .handle((c) => {
    // c.valid typed based on config
  });
```

---

## ✅ BENEFITS SUMMARY

### Developer Experience Improvements

| Aspect                  | Old API                           | New API                                                 |
| ----------------------- | --------------------------------- | ------------------------------------------------------- |
| **Type Safety**         | Manual annotation required        | Fully automatic ✨                                      |
| **Multiple Sources**    | Multiple middleware calls         | Single validate call ✨                                 |
| **Discoverability**     | `c.req.valid("?")` string literal | `c.valid.` autocomplete shows only validated sources ✨ |
| **Compile-Time Safety** | Runtime string matching           | Typed object keys ✨                                    |
| **Error Reporting**     | First error only                  | All errors accumulated ✨                               |
| **Middleware Count**    | Limited by overloads              | Unlimited ✨                                            |
| **Code Length**         | Verbose with type annotations     | Concise, no annotations ✨                              |
| **Simple Routes**       | Unchanged                         | Unchanged ✨                                            |

### Example Comparison

**Old API (11 lines, 3 manual types):**

```typescript
app.post(
  "/users/:id",
  validate("params", z.object({ id: z.string().uuid() })),
  validate("json", z.object({ name: z.string(), email: z.string().email() })),
  validate("search-params", z.object({ notify: z.boolean().optional() })),
  async (c) => {
    const { id } = c.req.valid<{ id: string }>("params");
    const { name, email } = c.req.valid<{ name: string; email: string }>(
      "json",
    );
    const { notify } = c.req.valid<{ notify?: boolean }>("search-params");
  },
);
```

**New API (10 lines, 0 manual types):**

```typescript
app.post("/users/:id")
  .validate({
    params: z.object({ id: z.string().uuid() }),
    json: z.object({ name: z.string(), email: z.string().email() }),
    search: z.object({ notify: z.boolean().optional() }),
  })
  .handle((c) => {
    const { id } = c.valid.params;
    const { name, email } = c.valid.json;
    const { notify } = c.valid.search;
  });
```

**Improvements:**

- ✅ 1 fewer line
- ✅ 1 validate call instead of 3 middleware calls
- ✅ 0 manual type annotations (was 3)
- ✅ Full type safety maintained
- ✅ Better error accumulation
- ✅ Unlimited middleware support
- ✅ Simple routes unchanged

---

## 🧪 TEST COVERAGE PLAN

```typescript
describe("Route Builder Validation", () => {
  describe("RouteBuilder", () => {
    it("returns builder when no middleware provided");
    it("registers route directly when middleware provided");
    it("transitions to ValidatedRouteBuilder via .validate()");
  });

  describe("ValidatedRouteBuilder - single source", () => {
    it("validates json and provides typed access");
    it("validates form and provides typed access");
    it("validates params and provides typed access");
    it("validates search and provides typed access");
    it("handles validation failure with generic error");
    it("handles validation failure with reportErrors");
  });

  describe("ValidatedRouteBuilder - multiple sources", () => {
    it("validates params + json simultaneously");
    it("validates all four sources simultaneously");
    it("provides correctly typed access to all sources");
    it("accumulates errors from multiple failed validations");
    it("succeeds only if all sources valid");
  });

  describe("middleware support", () => {
    it("works with 0 middleware");
    it("works with 1 middleware");
    it("works with 5 middleware");
    it("works with 10+ middleware");
    it("maintains type inference with any middleware count");
  });

  describe("error handling", () => {
    it("returns 400 on validation failure");
    it("reports all errors when reportErrors: true");
    it("calls custom onError handler with all errors");
    it("accumulates errors from all sources");
    it("includes source name in accumulated errors");
    it("handles extraction errors (invalid JSON)");
  });

  describe("edge cases", () => {
    it("handles empty config object as no-op");
    it("handles multi-value form fields");
    it("handles multi-value search params");
    it("handles 3+ occurrences of same field");
    it("filters out File objects from form data");
    it("throws on invalid source");
  });

  describe("type safety", () => {
    it("infers correct types from schemas");
    it("makes valid readonly (cannot reassign)");
    it("makes valid properties readonly (cannot reassign c.valid.json)");
    it("only includes validated sources in type");
    it("prevents access to non-validated sources");
  });
});
```

---

## 🎯 ACCEPTANCE CRITERIA

### Type Safety

- [ ] No manual type annotations required
- [ ] TypeScript autocomplete shows `c.valid.{source}` for validated sources
      only
- [ ] Accessing non-validated source shows TypeScript error
- [ ] Multi-source validation composes types correctly
- [ ] `c.valid` is readonly (cannot reassign `c.valid = {}`)
- [ ] `c.valid.{source}` properties are readonly (cannot reassign
      `c.valid.json = {}`)
- [ ] Works with unlimited middleware count

### API Design

- [ ] Simple routes require no builder (backward compatible)
- [ ] `.validate()` accepts `json`, `form`, `params`, `search`
- [ ] Empty config `{}` acts as no-op validation
- [ ] `c.valid` only contains validated sources
- [ ] All source names are valid identifiers (no dashes, dot notation works)
- [ ] Builder pattern is fluent and readable

### Error Handling

- [ ] Validates all sources (doesn't fail-fast)
- [ ] Accumulates all validation errors
- [ ] `reportErrors: true` returns all errors with source names
- [ ] `onError` handler receives all accumulated errors
- [ ] Extraction errors (invalid JSON) are caught and reported

### Behavior

- [ ] All current test cases pass with new API
- [ ] Form/search multi-values handled correctly
- [ ] File objects filtered from form data
- [ ] Invalid source throws error

### Clean Architecture

- [ ] No validation methods on `MageRequest`
- [ ] No validation storage in `MageRequest`
- [ ] Extraction logic in separate `extractors.ts` file
- [ ] Validation logic in separate `validator.ts` file
- [ ] Types in separate `types.ts` file
- [ ] Builders in separate `route-builder.ts` file

### Documentation

- [ ] README shows new API with examples
- [ ] Migration guide provided
- [ ] JSDoc on all public APIs
- [ ] Examples demonstrate type inference
- [ ] Advanced usage patterns documented

---

## 🎯 SUCCESS METRICS

After implementation, we should see:

### Code Quality

- [ ] Zero validation-related methods on `MageRequest`
- [ ] All validation logic in `validate/` module
- [ ] Test coverage >95% for validation module
- [ ] Clean separation between builders and core app

### Developer Experience

- [ ] No manual type annotations in examples
- [ ] TypeScript autocomplete shows only valid sources
- [ ] Error messages include all validation failures
- [ ] Simple routes remain simple

### Performance

- [ ] No performance regression vs old API
- [ ] Validation errors accumulated without N+1 queries
- [ ] Memory usage stable (no leaks from context extension)
- [ ] Builder pattern adds no runtime overhead

---

## ✅ READY FOR IMPLEMENTATION

This plan implements:

1. ✅ Builder pattern: `app.post("/").validate({ ... }).handle((c) => { ... })`
2. ✅ Auto-typed access: `c.valid.json` (no manual annotations)
3. ✅ Better naming: No dashes in source names (`search` not `search-params`)
4. ✅ Error accumulation: All validation errors returned together
5. ✅ Clean separation: No validation in `MageRequest`
6. ✅ TypeScript safety: Only validated sources in intellisense
7. ✅ Two-level readonly: `c.valid` and `c.valid.json` both readonly
8. ✅ Unlimited middleware: No type inference limits
9. ✅ Simple routes unchanged: Backward compatible for non-validated routes

**Key improvements:**

- ✅ Solves TypeScript type propagation problem with builder pattern
- ✅ Unlimited middleware without losing type inference
- ✅ Simple routes stay simple (no builder needed)
- ✅ Clear API distinction between validated and non-validated routes
- ✅ Zero breaking changes for routes without validation

**Next steps:**

1. Execute Phase 1: Create validation foundation (types, extractors, validator)
2. Execute Phase 2: Create route builders
3. Execute Phase 3: Integrate with MageApp
4. Execute Phase 4: Clean up old code
5. Execute Phase 5: Comprehensive testing and documentation

Let's build this!
