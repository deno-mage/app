---
title: "Serve Files"
description: "Serve static files from a directory with path traversal protection"
---

# Serve Files

The Serve Files middleware handles serving static files (HTML, CSS, JavaScript,
images) from a directory on your server. It includes built-in path traversal
protection, automatic index.html serving for directories, and intelligent file
extension handling.

## Quick Start

```typescript
import { MageApp } from "@mage/app";
import { serveFiles } from "@mage/middleware/serve-files";

const app = new MageApp();

// Serve files from the public directory
app.get(
  "/static/*",
  serveFiles({
    directory: "./public",
  }),
);

// Requests to /static/style.css serve ./public/style.css
// Requests to /static/ serve ./public/index.html (if it exists)

Deno.serve(app.handler);
```

## How It Works

Serves files from a directory on GET/HEAD wildcard routes. Checks files in
order: exact match, directory index (`index.html` if enabled), `.html`
extension. Prevents path traversal by validating resolved paths stay within the
configured directory. Returns 405 for non-GET/HEAD methods.

## Options

| Option       | Type      | Default    | Description                                      |
| ------------ | --------- | ---------- | ------------------------------------------------ |
| `directory`  | `string`  | (required) | Directory to serve files from                    |
| `serveIndex` | `boolean` | `true`     | Serve `index.html` when a directory is requested |

### directory

The filesystem path to serve files from. This should be a relative or absolute
path:

```typescript
// Relative path (relative to current working directory)
app.get(
  "/static/*",
  serveFiles({
    directory: "./public",
  }),
);

// Absolute path (recommended for serverless)
import { resolve } from "@std/path";
app.get(
  "/static/*",
  serveFiles({
    directory: resolve(Deno.cwd(), "public"),
  }),
);
```

For serverless environments and production deployments, use absolute paths to
ensure consistency across different execution contexts.

### serveIndex

When `true` (the default), the middleware serves `index.html` for directory
requests. Set to `false` to disable this behavior:

```typescript
// serveIndex: true (default)
app.get(
  "/docs/*",
  serveFiles({
    directory: "./docs",
    serveIndex: true, // This is the default
  }),
);
// Request: GET /docs/
// Serves: ./docs/index.html (if it exists)
// No file? → 404

// serveIndex: false
app.get(
  "/files/*",
  serveFiles({
    directory: "./files",
    serveIndex: false,
  }),
);
// Request: GET /files/
// Result: 404 (directories never served)
```

## Examples

### Serve a Static Website

```typescript
import { MageApp } from "@mage/app";
import { serveFiles } from "@mage/middleware/serve-files";

const app = new MageApp();

// Serve all static files from the dist directory
app.get(
  "/static/*",
  serveFiles({
    directory: "./dist",
  }),
);

// You might also serve from the root
app.get(
  "/*",
  serveFiles({
    directory: "./dist",
  }),
);

Deno.serve(app.handler);
```

Requests like `/static/index.html`, `/static/images/logo.png`, and
`/static/css/style.css` all work correctly.

### Serve a Single-Page Application

For SPAs, you typically want to serve `index.html` for all HTML routes and let
the client-side router handle navigation:

```typescript
import { MageApp } from "@mage/app";
import { serveFiles } from "@mage/middleware/serve-files";

const app = new MageApp();

// Serve static assets with their proper extensions
app.get(
  "/assets/*",
  serveFiles({
    directory: "./dist/assets",
  }),
);

// Serve HTML routes by appending .html
// Request: GET /dashboard → serves ./dist/dashboard.html
app.get(
  "/*",
  serveFiles({
    directory: "./dist",
  }),
);

Deno.serve(app.handler);
```

With this setup:

- `/assets/app.js` serves the JavaScript bundle
- `/dashboard` serves `./dist/dashboard.html`
- `/` serves `./dist/index.html` (directory index)
- `/admin/settings` serves `./dist/admin/settings.html`

### Serve User Uploads

Serve user-generated files with path traversal protection:

```typescript
import { MageApp } from "@mage/app";
import { serveFiles } from "@mage/middleware/serve-files";

const app = new MageApp();

// Serve uploaded files
app.get(
  "/uploads/*",
  serveFiles({
    directory: "./uploads",
    serveIndex: false, // Don't list directories
  }),
);

// Even if an attacker tries ../../../etc/passwd, it's blocked
// Request: GET /uploads/../../etc/passwd
// Result: 404 Not Found

Deno.serve(app.handler);
```

### Serve Documentation

```typescript
import { MageApp } from "@mage/app";
import { serveFiles } from "@mage/middleware/serve-files";

const app = new MageApp();

// Serve documentation with automatic index.html
app.get(
  "/docs/*",
  serveFiles({
    directory: "./docs",
    serveIndex: true,
  }),
);

Deno.serve(app.handler);
```

Requests work intuitively:

- `/docs/` serves `./docs/index.html`
- `/docs/guides` serves `./docs/guides/index.html`
- `/docs/guides/getting-started` serves `./docs/guides/getting-started.html`

## Security Considerations

**Path traversal protection**: Built-in. Validates all paths stay within
configured directory, even with URL encoding or symbolic links.

**Important**:

- Don't serve project root—only serve specific directories
- Middleware respects filesystem permissions (unreadable = 404)
- No directory listing (returns 404 unless `index.html` exists)
- Correct `Content-Type` headers set automatically

## Notes

- Must use wildcard routes (e.g., `/static/*`)
- GET and HEAD only (other methods return 405)
- For large files, use CDN or nginx in production

## Common Patterns

### Combine with Cache Control

```typescript
import { MageApp } from "@mage/app";
import { serveFiles } from "@mage/middleware/serve-files";
import { cacheControl } from "@mage/middleware/cache-control";

const app = new MageApp();

// Cache static assets for a long time
app.use(
  cacheControl({
    match: "/assets/*",
    directive: "public, max-age=31536000, immutable",
  }),
);

app.get(
  "/assets/*",
  serveFiles({
    directory: "./dist/assets",
  }),
);

Deno.serve(app.handler);
```

### Serve Multiple Directories

```typescript
import { MageApp } from "@mage/app";
import { serveFiles } from "@mage/middleware/serve-files";

const app = new MageApp();

// Serve assets from dist
app.get(
  "/assets/*",
  serveFiles({
    directory: "./dist/assets",
  }),
);

// Serve public files
app.get(
  "/public/*",
  serveFiles({
    directory: "./public",
  }),
);

// Serve downloads
app.get(
  "/downloads/*",
  serveFiles({
    directory: "./downloads",
    serveIndex: false,
  }),
);

Deno.serve(app.handler);
```

### Conditional Serving

```typescript
import { MageApp } from "@mage/app";
import { serveFiles } from "@mage/middleware/serve-files";

const app = new MageApp();

const directory = Deno.env.get("NODE_ENV") === "production"
  ? "./dist"
  : "./public";

app.get("/*", serveFiles({ directory }));

Deno.serve(app.handler);
```

## Related

- [Middleware System](/core/middleware) - How middleware works in Mage
- [MageContext](/core/mage-context) - Request and response context
- [Cache Control](/middleware/cache-control) - Add caching headers to responses
- [CORS](/middleware/cors) - Handle cross-origin requests for static assets
