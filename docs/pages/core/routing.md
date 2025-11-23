---
title: "Routing"
description: "Route patterns, matching, and URL parameter extraction in Mage"
layout: "article"
---

# Routing

Routing maps incoming HTTP requests to handler functions based on URL patterns
and HTTP methods. Mage provides a flexible routing system with built-in security
features and support for custom router implementations.

## Quick Start

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

// Static route
app.get("/", (c) => c.text("Home"));

// Route with parameter
app.get("/users/:id", (c) => {
  const userId = c.req.params.id;
  return c.json({ id: userId });
});

// Wildcard route
app.get("/files/*", (c) => {
  const path = c.req.wildcard;
  return c.text(`File path: ${path}`);
});
```

## Route Patterns

Routes are defined using URL patterns that match incoming request paths.

### Static Routes

Static routes match exact paths:

```typescript
app.get("/", (c) => c.text("Home"));
app.get("/about", (c) => c.text("About"));
app.get("/contact/form", (c) => c.text("Contact Form"));
```

Matches only the exact path. `/about` matches, but `/about/team` does not.

### Route Parameters

Use `:param` syntax to capture dynamic segments from the URL:

```typescript
app.get("/users/:id", (c) => {
  const userId = c.req.params.id;
  return c.json({ id: userId });
});

app.get("/posts/:postId/comments/:commentId", (c) => {
  const postId = c.req.params.postId;
  const commentId = c.req.params.commentId;
  return c.json({ postId, commentId });
});
```

**Key behaviors:**

- Parameters automatically decode URL encoding
- Parameters are validated to prevent path traversal attacks
- Each parameter name must be unique within a route
- Parameters cannot be empty (`/users/` does not match `/users/:id`)

### Wildcard Routes

Use `*` to match any remaining path segments:

```typescript
app.get("/files/*", (c) => {
  const filePath = c.req.wildcard;
  return c.text(`Accessing: ${filePath}`);
});

app.get("/api/v1/*", (c) => {
  const endpoint = c.req.wildcard;
  return c.json({ endpoint });
});
```

**Wildcard rules:**

- Wildcard must be the last segment in the route pattern
- Matches zero or more path segments
- Access matched path via `c.req.wildcard`
- Only one wildcard allowed per route

```typescript
// Valid
app.get("/static/*", handler);
app.get("/api/v1/*", handler);

// Invalid - wildcard must be last
app.get("/*/admin", handler); // Error at registration
```

## Accessing Route Data

### Parameters

Parameters are available on `c.req.params`:

```typescript
app.get("/users/:userId/posts/:postId", (c) => {
  const { userId, postId } = c.req.params;
  return c.json({ userId, postId });
});

// GET /users/alice/posts/42
// → { userId: "alice", postId: "42" }
```

### Wildcard

Wildcard paths are available on `c.req.wildcard`:

```typescript
app.get("/docs/*", (c) => {
  const docPath = c.req.wildcard;
  return c.text(`Documentation: ${docPath}`);
});

// GET /docs/api/routing.html
// → "Documentation: api/routing.html"
```

## Route Matching

Mage uses the `LinearRouter` by default, which matches routes using a linear
search algorithm.

### How LinearRouter Works

1. **Normalize path**: Removes consecutive slashes, ensures leading slash
2. **Split into segments**: Both route pattern and request path
3. **Match segment by segment**:
   - Static segments must match exactly
   - Parameters (`:name`) extract and validate the segment
   - Wildcard (`*`) matches all remaining segments
4. **Verify complete match**: No extra segments in request path

```typescript
// Route: /users/:id/posts
// Path:  /users/42/posts

// Matching process:
// 1. Normalize: /users/42/posts (already normalized)
// 2. Split: ["", "users", "42", "posts"]
// 3. Match:
//    - "" === "" ✓
//    - "users" === "users" ✓
//    - ":id" extracts "42" ✓
//    - "posts" === "posts" ✓
// 4. Same length ✓
// Result: Match with params.id = "42"
```

### Performance Characteristics

LinearRouter uses O(n) linear search:

- Iterates through all registered routes until a match is found
- Best for applications with fewer than 100 routes
- Simple, predictable, and easy to debug
- No preprocessing or tree construction overhead

```typescript
// With 50 routes, worst case checks all 50
// Still completes in microseconds for typical apps
```

## Route Priority

When multiple routes could match a path, Mage selects the most specific route
based on a scoring system:

**Specificity scores (per segment):**

- Static segment: 3 points (highest priority)
- Parameter segment (`:param`): 2 points
- Wildcard segment (`*`): 1 point (lowest priority)

```typescript
app.get("/users/admin", handler1); // Score: 6 (3 + 3)
app.get("/users/:id", handler2); // Score: 5 (3 + 2)
app.get("/*", handler3); // Score: 1

// GET /users/admin → handler1 (most specific)
// GET /users/42 → handler2
// GET /anything/else → handler3
```

This ensures that exact matches take precedence over parameterized routes, and
parameterized routes take precedence over wildcards.

## Path Normalization

Mage automatically normalizes paths to prevent confusion attacks and match
standard web server behavior.

### Normalization Rules

1. Remove consecutive slashes: `//` → `/`
2. Remove trailing slashes (except root)
3. Ensure leading slash

```typescript
// All of these normalize to the same path:
"/users/42"     → "/users/42"
"//users//42"   → "/users/42"
"/users/42/"    → "/users/42"
"///users///42" → "/users/42"

// Root path remains unchanged:
"/" → "/"
```

This prevents attackers from using path variations to bypass security rules:

```typescript
// Without normalization, these would be different:
app.get("/admin/users", requireAuth);

// Attacker tries: //admin//users
// With normalization: Both resolve to /admin/users
```

## Path Traversal Protection

Mage validates all route parameters to prevent path traversal attacks.

### Validation Process

When a parameter is extracted:

1. URL decode the parameter value
2. Check for dangerous patterns (case-insensitive)
3. Reject request if path traversal detected

```typescript
app.get("/files/:filename", (c) => {
  // c.req.params.filename is already validated
  const filename = c.req.params.filename;
  return c.text(`File: ${filename}`);
});

// Safe requests:
// GET /files/document.pdf → filename = "document.pdf"
// GET /files/my%20file.txt → filename = "my file.txt"

// Blocked requests (400 Bad Request):
// GET /files/../etc/passwd
// GET /files/..%2Fetc%2Fpasswd
// GET /files/%2e%2e/secrets
```

### Detected Patterns

Mage detects these path traversal patterns:

- `../` - Basic Unix path traversal
- `..\` - Windows path traversal
- `%2e%2e/` - URL encoded `../`
- `%2e%2e\` - URL encoded `..\`
- `..%2f` - Partially encoded `../`
- `..%5c` - Partially encoded `..\`

Detection is case-insensitive to prevent evasion attempts.

## Route Validation

Routes are validated when registered to catch errors early.

### Format Validation

```typescript
// Valid routes
app.get("/", handler);
app.get("/users", handler);
app.get("/users/:id", handler);
app.get("/files/*", handler);

// Invalid routes (throw MageError)
app.get("", handler); // Empty route
app.get("users", handler); // Missing leading /
app.get("/users//posts", handler); // Consecutive slashes
app.get("/*/admin", handler); // Wildcard not at end
app.get("/users/:", handler); // Empty parameter name
```

### Duplicate Detection

Mage prevents duplicate routes that would cause parameter conflicts:

```typescript
app.get("/users/:id", handler1);
app.get("/users/:userId", handler2); // Error: Duplicate route

// Both routes match /users/42
// Only the last match's params would be available
// Mage prevents this by detecting functional duplicates
```

Routes are considered duplicates if they have the same pattern structure, even
with different parameter names:

```typescript
// These are functionally identical:
"/users/:id"     → "/users/:param"
"/users/:userId" → "/users/:param"
// Error: Duplicate detected
```

## Custom Router Implementation

You can implement custom routing strategies by implementing the `MageRouter`
interface.

### MageRouter Interface

```typescript
interface MageRouter {
  /**
   * Match middleware for a given request and extract parameters.
   */
  match(url: URL, method: string): MatchResult;

  /**
   * Get available HTTP methods for a pathname.
   */
  getAvailableMethods(url: URL): string[];

  /**
   * Register global middleware (runs on every request).
   */
  use(...middleware: (MageMiddleware | MageMiddleware[])[]): void;

  /**
   * Register middleware for specific HTTP methods.
   */
  get(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void;
  post(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void;
  put(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void;
  delete(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void;
  patch(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void;
  options(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void;
  head(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void;
  all(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void;
}
```

### MatchResult

The `match()` method returns a `MatchResult`:

```typescript
interface MatchResult {
  middleware: MageMiddleware[];
  matchedRoutename: boolean;
  matchedMethod: boolean;
  params: { [key: string]: string };
  wildcard?: string;
}
```

**Fields:**

- `middleware`: Array of middleware to execute for this request
- `matchedRoutename`: Whether any route pattern matched the path
- `matchedMethod`: Whether the HTTP method matched
- `params`: Extracted route parameters (empty object if none)
- `wildcard`: Wildcard path if route uses `*` (undefined if not)

### Implementation Example

```typescript
import type { MageMiddleware, MageRouter, MatchResult } from "@mage/app";

class RadixRouter implements MageRouter {
  private tree: RadixNode = new RadixNode();

  match(url: URL, method: string): MatchResult {
    // Implement radix tree traversal
    const node = this.tree.search(url.pathname);

    if (!node) {
      return {
        middleware: [],
        matchedRoutename: false,
        matchedMethod: false,
        params: {},
      };
    }

    return {
      middleware: node.middleware,
      matchedRoutename: true,
      matchedMethod: node.methods.includes(method),
      params: node.params,
    };
  }

  getAvailableMethods(url: URL): string[] {
    const node = this.tree.search(url.pathname);
    return node?.methods ?? [];
  }

  use(...middleware: (MageMiddleware | MageMiddleware[])[]): void {
    // Register global middleware
  }

  get(
    routenameOrMiddleware: string | MageMiddleware | MageMiddleware[],
    ...middleware: (MageMiddleware | MageMiddleware[])[]
  ): void {
    // Register GET route in radix tree
  }

  // Implement other HTTP method handlers...
}
```

### Using a Custom Router

Pass your custom router to `MageApp`:

```typescript
import { MageApp } from "@mage/app";
import { RadixRouter } from "./radix-router.ts";

const app = new MageApp({
  router: new RadixRouter(),
});

app.get("/users/:id", (c) => {
  return c.json({ id: c.req.params.id });
});
```

### When to Build a Custom Router

Consider a custom router when:

- Your application has hundreds or thousands of routes
- You need O(log n) or O(1) lookup performance
- You require specialized matching logic (regex patterns, etc.)
- You want route grouping or namespacing features

For most applications, `LinearRouter` provides excellent performance and
simplicity.

## Related

- [MageApp](/core/mage-app) - Main application class and route registration
- [Middleware](/core/middleware) - Middleware patterns and execution order
- [MageContext](/core/mage-context) - Accessing request data and parameters
- [Error Handling](/advanced/error-handling) - Handling route errors
