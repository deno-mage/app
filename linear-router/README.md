# Linear Router

A simple, fast, and reliable router implementation using linear search (O(n)
complexity).

## Overview

The Linear Router is the **default router** for Mage applications. It uses a
straightforward array-based linear search algorithm to match routes, making it
ideal for most use cases, especially serverless and edge deployments.

Routes are automatically sorted by specificity when matching, so static routes
always take precedence over parameterized routes, which take precedence over
wildcards - regardless of registration order.

## When to Use

**✅ Best for:**

- Serverless functions (AWS Lambda, Cloudflare Workers, Deno Deploy)
- Edge computing with frequent cold starts
- Small to medium applications (< 100 routes)
- Development and testing
- Any scenario where cold start latency is critical

**⚠️ Consider alternatives for:**

- Long-running servers with 500+ routes
- Ultra-high traffic scenarios (millions of requests per instance)

## Installation

The Linear Router is the default - no installation needed:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp(); // Uses LinearRouter automatically
```

Explicit usage:

```typescript
import { MageApp } from "@mage/app";
import { LinearRouter } from "@mage/linear-router";

const app = new MageApp({
  router: new LinearRouter(),
});
```

## Performance Characteristics

### Time Complexity

- **Route registration**: O(1) - simple array push
- **Route matching**: O(n) - linear search through all routes
- **Method discovery**: O(n) - linear search for matching routes

### Startup Performance

| Routes | Registration Time |
| ------ | ----------------- |
| 10     | < 1ms             |
| 50     | < 1ms             |
| 100    | < 1ms             |
| 500    | ~1ms              |
| 1000   | ~2ms              |

**Cold start overhead**: Negligible (< 1ms for most applications)

### Request Performance

| Routes | Avg Match Time | Worst Case |
| ------ | -------------- | ---------- |
| 10     | ~10µs          | ~50µs      |
| 50     | ~50µs          | ~250µs     |
| 100    | ~100µs         | ~500µs     |
| 500    | ~500µs         | ~2.5ms     |

**Note**: Times vary by route complexity (static vs parameterized vs wildcard)

## Features

### Route Types

**Static Routes**

```typescript
app.get("/users", handler);
app.post("/api/login", handler);
```

**Parameterized Routes**

```typescript
app.get("/users/:id", (c) => {
  const userId = c.req.params.id;
  c.json({ userId });
});

app.get("/posts/:postId/comments/:commentId", (c) => {
  const { postId, commentId } = c.req.params;
  c.json({ postId, commentId });
});
```

**Wildcard Routes**

```typescript
app.get("/files/*", (c) => {
  const filePath = c.req.wildcard;
  c.json({ filePath });
});

app.get("/docs/:section/*", (c) => {
  const section = c.req.params.section;
  const path = c.req.wildcard;
  c.json({ section, path });
});
```

### Route Priority

Routes are matched in order of specificity:

1. **Static routes** (exact matches) - highest priority
2. **Parameterized routes** (`:param`)
3. **Wildcard routes** (`*`) - lowest priority

Within the same priority level, routes registered first take precedence.

**Example:**

```typescript
app.get("/users/admin", adminHandler); // 1. Checked first (static)
app.get("/users/:id", userHandler); // 2. Checked second (param)
app.get("/users/*", catchAllHandler); // 3. Checked last (wildcard)

// GET /users/admin → adminHandler ✅
// GET /users/123 → userHandler ✅
// GET /users/foo/bar → catchAllHandler ✅
```

### HTTP Method Support

All standard HTTP methods are supported:

```typescript
app.get("/resource", handler); // GET, HEAD
app.post("/resource", handler); // POST
app.put("/resource", handler); // PUT
app.delete("/resource", handler); // DELETE
app.patch("/resource", handler); // PATCH
app.options("/resource", handler); // OPTIONS
app.head("/resource", handler); // HEAD
app.all("/resource", handler); // All methods
```

### Method Not Allowed (405)

Automatically returns 405 when a route matches but the method doesn't:

```typescript
app.get("/users", getUsers);
app.post("/users", createUser);

// GET /users → 200 ✅
// POST /users → 200 ✅
// DELETE /users → 405 Method Not Allowed
// Response includes: Allow: GET, HEAD, POST
```

### Not Found (404)

Automatically returns 404 when no route matches:

```typescript
app.get("/users", handler);

// GET /users → 200 ✅
// GET /posts → 404 Not Found
```

## Security

### Route Pattern Validation

The Linear Router validates route patterns during registration to catch common
mistakes early and prevent runtime errors:

```typescript
const app = new MageApp();

// ✅ Valid routes
app.get("/", handler); // Root route
app.get("/users", handler); // Static route
app.get("/users/:id", handler); // Parameterized route
app.get("/files/*", handler); // Wildcard route
app.get("/docs/:section/*", handler); // Params + wildcard

// ❌ Invalid routes - throw MageError at registration time
app.get("", handler); // Empty route
app.get("users", handler); // Must start with /
app.get("/users//posts", handler); // Consecutive slashes
app.get("/users/", handler); // Trailing slash (empty segment)
app.get("/files/*/download", handler); // Wildcard must be at end
app.get("/users/:id/posts/:id", handler); // Duplicate param names
app.get("/users/:", handler); // Empty param name
```

**Validation rules:**

1. **Not empty** - Route must have at least one character
2. **Starts with /** - All routes must begin with forward slash
3. **No consecutive slashes** - e.g., `//` is not allowed in patterns
4. **No trailing slashes** - Use `/users` not `/users/`
5. **Wildcard at end only** - `*` must be the last segment
6. **Unique param names** - No duplicate `:param` names in same route
7. **Non-empty params** - Parameter names cannot be empty (`:` alone)

**Why validate?**

- Catches typos and mistakes at registration time, not runtime
- Prevents confusing behavior from malformed patterns
- Ensures consistent routing behavior
- Provides clear error messages for debugging

### Duplicate Route Validation

The Linear Router validates route registrations to prevent conflicts that would
cause param confusion. Each route pattern can only be registered once per HTTP
method:

```typescript
const app = new MageApp();

// ✅ Allowed - different HTTP methods
app.get("/users/:id", getUser);
app.post("/users/:id", createUser);
app.put("/users/:id", updateUser);

// ✅ Allowed - different route patterns
app.get("/users/:id", getUser);
app.get("/posts/:id", getPost);

// ❌ Error - duplicate pattern with same method
app.get("/users/:id", handler1);
app.get("/users/:userId", handler2); // Throws MageError
// These are functionally identical patterns!

// ❌ Error - method overlap with all()
app.get("/users/:id", handler1);
app.all("/users/:userId", handler2); // Throws MageError
// all() includes GET, which conflicts
```

**Why this matters:**

Without validation, registering `/users/:id` and `/users/:userId` would allow
both handlers to run, but only the last one's params would be available. This
causes bugs where `handler1` expects `c.req.params.id` but receives
`c.req.params.userId` instead.

The router normalizes patterns by replacing all param names with placeholders
(`/users/:param`) to detect functional duplicates, regardless of param naming.

### Path Normalization

The Linear Router automatically normalizes incoming request paths to handle edge
cases and match common web server behavior:

```typescript
const app = new MageApp();
app.get("/users/:id", handler);

// All of these requests match the same route:
// GET /users/123        → ✅ params.id = "123"
// GET /users//123       → ✅ params.id = "123" (consecutive slashes)
// GET //users/123       → ✅ params.id = "123" (leading slashes)
// GET /users/123/       → ✅ params.id = "123" (trailing slash)
// GET /users///123///   → ✅ params.id = "123" (multiple slashes)
```

**Normalization rules:**

1. **Consecutive slashes are collapsed** - `/users//123` becomes `/users/123`
2. **Trailing slashes are removed** - `/users/123/` becomes `/users/123`
3. **Leading slashes are preserved** - All paths start with `/`
4. **Empty segments are removed** - Caused by multiple slashes

**Why normalize?**

- Prevents confusion between `/users/123` and `/users//123` being treated as
  different routes
- Matches common web server behavior (Nginx, Apache, etc.)
- Improves security by preventing path-based confusion attacks
- Provides better developer experience with consistent routing

**Note:** URL-encoded slashes (`%2F`) in parameters are NOT treated as path
separators and are preserved after decoding.

### Path Traversal Protection

All parameterized routes are automatically protected against path traversal
attacks:

```typescript
app.get("/files/:filename", (c) => {
  // These requests are automatically blocked with 400 Bad Request:
  // GET /files/../etc/passwd
  // GET /files/..%2Fetc/passwd
  // GET /files/%2e%2e/etc/passwd
  // GET /files/..\windows\system32

  const filename = c.req.params.filename; // Safe to use
  c.text(`File: ${filename}`);
});
```

**Protected patterns:**

- `../` (basic path traversal)
- `..\` (Windows path traversal)
- `%2e%2e/` (URL encoded `../`)
- `%2e%2e\` (URL encoded `..\`)
- `..%2f` (partially encoded)
- `..%5c` (partially encoded backslash)

**Invalid parameter encoding:**

```typescript
// Malformed URL encoding is rejected with 400
// GET /files/%XX%YY → 400 Bad Request
```

## Algorithm Details

### Route Matching Process

```typescript
// For request: GET /users/123

1. Split path: ["", "users", "123"]
2. Iterate through registered routes:
   - Check if routename pattern matches
   - Extract parameters if route has `:param`
   - Extract wildcard if route has `*`
   - Calculate specificity score (static=3, param=2, wildcard=1)
   - Check if HTTP method matches
3. Sort matched routes by specificity (highest first)
4. Collect middleware from sorted matches
5. Return MatchResult with middleware and params
```

### Data Structure

```typescript
interface RouterEntry {
  methods?: string[];        // e.g., ["GET", "HEAD"]
  routename?: string;        // e.g., "/users/:id"
  middleware: MageMiddleware[];
}

// Routes stored as simple array:
private _entries: RouterEntry[] = [];
```

**Why an array?**

- Simple and predictable
- Minimal memory overhead
- Fast iteration for small/medium route counts
- Easy to debug and understand
- Perfect for serverless cold starts

## Examples

### Basic Application

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp(); // Uses LinearRouter by default

app.get("/", (c) => {
  c.text("Hello, World!");
});

app.get("/users/:id", (c) => {
  c.json({ userId: c.req.params.id });
});

Deno.serve(app.handler);
```

### API with Multiple Routes

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

// Static routes
app.get("/health", (c) => c.json({ status: "ok" }));
app.get("/version", (c) => c.json({ version: "1.0.0" }));

// Parameterized routes
app.get("/users/:id", getUser);
app.put("/users/:id", updateUser);
app.delete("/users/:id", deleteUser);

// Nested parameters
app.get("/orgs/:orgId/users/:userId", getOrgUser);

// Wildcard routes
app.get("/docs/*", serveDocumentation);
app.get("/static/*", serveStaticFiles);

Deno.serve(app.handler);
```

### Global Middleware

```typescript
import { MageApp } from "@mage/app";
import { logger } from "@mage/logs";
import { cors } from "@mage/cors";

const app = new MageApp();

// Applied to all routes
app.use(logger());
app.use(cors());

// Applied to specific routes
app.get("/api/*", authenticate, rateLimit);

app.get("/api/users", getUsers);
app.post("/api/users", createUser);

Deno.serve(app.handler);
```

## Debugging

### Enabling Debug Logs

```typescript
// Log all route registrations
const app = new MageApp();

app.get("/users", handler);
console.log("Registered: GET /users");

app.get("/users/:id", handler);
console.log("Registered: GET /users/:id");
```

### Common Issues

**Duplicate route error:**

```typescript
// ❌ Error - functionally identical patterns
app.get("/users/:id", handler1);
app.get("/users/:userId", handler2);
// MageError: Duplicate route detected: "/users/:userId" conflicts with
// existing route "/users/:id" for method(s) GET, HEAD

// ✅ Fix - use the same param name
app.get("/users/:id", handler1);
app.get("/users/:id", handler2); // Still error - same route!

// ✅ Actually fix - use different paths or combine handlers
app.get("/users/:id", composedHandler);
```

**Routes not matching:**

```typescript
// ❌ Wrong - extra slash
app.get("/users/", handler); // Registered as /users/
// GET /users → 404 (no trailing slash)

// ✅ Correct
app.get("/users", handler);
// GET /users → 200 ✅
```

**Parameter not found:**

```typescript
// ❌ Wrong - typo in parameter name
app.get("/users/:userId", (c) => {
  const id = c.req.params.id; // undefined! Should be userId
});

// ✅ Correct
app.get("/users/:userId", (c) => {
  const id = c.req.params.userId; // ✅
});
```

**Wildcard not captured:**

```typescript
// ❌ Wrong - wildcard must be at end
app.get("/files/*/download", handler); // Not supported

// ✅ Correct
app.get("/files/*", (c) => {
  const path = c.req.wildcard;
  // Handle download logic here
});
```

## Testing

```bash
# Run all linear-router tests
deno test linear-router/ --allow-all

# Run from project root
deno test --allow-all
```

The Linear Router has comprehensive unit tests covering:

- HTTP method matching (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, ALL)
- Static route matching
- Parameterized route matching with URL decoding
- Wildcard route matching
- Path normalization (consecutive slashes, trailing slashes)
- Route pattern validation (format, wildcards, params)
- Duplicate route validation
- Path traversal security validation
- Available methods discovery
- Route priority and ordering

**Test Files:**

- `tests/http-methods/` - HTTP method matching tests
- `tests/params.test.ts` - Parameter extraction tests
- `tests/wildcard.test.ts` - Wildcard route tests
- `tests/routenames.test.ts` - Static route matching tests
- `tests/path-normalization.test.ts` - Path normalization tests
- `tests/routename-validation.test.ts` - Route pattern validation tests
- `tests/duplicate-routes.test.ts` - Duplicate route validation tests
- `tests/security-path-traversal.test.ts` - Security validation tests
- `tests/available-methods.test.ts` - Method discovery tests

All tests use unit testing (no server required) for fast, isolated verification.

## Comparison with Other Routers

| Feature             | Linear Router  | Radix Router (future) |
| ------------------- | -------------- | --------------------- |
| Time Complexity     | O(n)           | O(log n)              |
| Startup Time        | < 1ms          | 5-30ms                |
| Memory Usage        | Low            | Medium                |
| Route Limit         | ~100 routes    | 1000+ routes          |
| Cold Start Friendly | ✅ Yes         | ❌ No                 |
| Simplicity          | ✅ Very simple | ⚠️ Complex            |
| Debugging           | ✅ Easy        | ⚠️ Harder             |

## Implementation Details

**File**: `linear-router/linear-router.ts`

**Key Functions:**

- `match(url, method)` - Main route matching logic
- `matchRoutename(routename, pathname)` - Pattern matching for single route
- `validateAndDecodeParam(value, paramName)` - Security validation
- `pushEntry(...)` - Internal route registration

**Dependencies:**

- `@mage/app/router` - MageRouter interface
- No external dependencies

## License

Part of the Mage framework.
