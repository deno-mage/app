<p align="center" style="color: #343a40">
  <img src="https://raw.githubusercontent.com/deno-mage/server/main/mage.png" alt="Mage logo" height="150" width="150">
  <h1 align="center">Mage</h1>
</p>
<p align="center">
  <strong>A no-nonsense web framework for Deno</strong>
</p>

<p align="center">
  <a href="https://jsr.io/@mage/app"><img src="https://jsr.io/badges/@mage/app" alt="JSR"></a>
  <a href="https://github.com/deno-mage/mage/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

---

## Why Mage?

**No-frills.** Just routing, middleware, and the essentials. No magic, no
surprises.

**Secure by default.** CSRF protection, CORS, CSP, rate limiting, and path
traversal prevention built-in.

**Simple and explicit.** Minimal abstractions. Predictable behavior. Easy to
debug.

**TypeScript-native.** Full type safety without configuration.

## Quick Start

```bash
deno add jsr:@mage/app
```

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

app.get("/", (c) => {
  c.text("Hello, world!");
});

Deno.serve(app.handler);
```

Run it: `deno run --allow-all main.ts`

## What's Included

### Core

- [**app**](./app) - Routing, middleware, context management
- [**linear-router**](./linear-router) - Simple O(n) router

### Middleware

- [**body-size**](./body-size) - Request body size limits
- [**cache-control**](./cache-control) - Cache-Control header management
- [**compression**](./compression) - Gzip response compression
- [**cors**](./cors) - Cross-Origin Resource Sharing
- [**csrf**](./csrf) - CSRF protection using Fetch Metadata
- [**csp**](./csp) - Content Security Policy headers
- [**rate-limit**](./rate-limit) - Sliding window rate limiting
- [**request-id**](./request-id) - Request ID tracking and tracing
- [**security-headers**](./security-headers) - HSTS, X-Frame-Options, etc.
- [**serve-files**](./serve-files) - Static file serving with cache-busting
- [**timeout**](./timeout) - Request timeout enforcement
- [**validate**](./validate) - Schema validation (Zod, Valibot, ArkType, etc.)

### Utilities

- [**cookies**](./cookies) - Signed cookie utilities
- [**logs**](./logs) - Console logger with colored output
- [**status**](./status) - HTTP status code utilities

### Static Site Generator

- [**pages**](./pages) - Markdown + Preact layouts with file-based routing

Built-in hot reload, asset cache-busting, and static builds. Requires Preact:

```bash
deno add jsr:@mage/app npm:preact npm:preact-render-to-string
```

Add to your `deno.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

### Import Examples

```typescript
import { MageApp } from "@mage/app";
import { cors } from "@mage/app/cors";
import { rateLimit } from "@mage/app/rate-limit";
import { pages } from "@mage/app/pages";
```

## Example: REST API

```typescript
import { MageApp } from "@mage/app";
import { cors } from "@mage/app/cors";
import { rateLimit } from "@mage/app/rate-limit";
import { validator } from "@mage/app/validate";
import { z } from "npm:zod";

const app = new MageApp();

// Security middleware
app.use(cors());
app.use(rateLimit({ max: 100, windowMs: 60000 }));

// Validated endpoint
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const { validate, valid } = validator({ json: createUserSchema });

app.post("/users", validate, async (c) => {
  const { json } = valid(c);
  const user = await db.users.create(json);
  c.json(user, 201);
});

app.get("/users/:id", async (c) => {
  const user = await db.users.find(c.req.params.id);
  if (!user) return c.notFound();
  c.json(user);
});

Deno.serve(app.handler);
```

## Example: Static Site

```typescript
import { MageApp } from "@mage/app";
import { pages } from "@mage/app/pages";

const { registerDevServer } = pages();

const app = new MageApp();
registerDevServer(app, { rootDir: "./docs" });

Deno.serve({ port: 3000 }, app.handler);
```

Write Markdown with frontmatter, create Preact layouts - get a static site with
hot reload in development and optimized builds for production. See
[pages module](./pages) for details.

## Performance

**~50,000 req/sec** on Apple M1 Max (simple routes)

**Cold start: < 1ms** for typical apps (< 100 routes)

Mage is ~15-30% faster than Oak, ~2.5x slower than Hono. Performance won't
bottleneck 99.9% of applications.

See [benchmarks](./benchmarks) for detailed comparison.

## Documentation

Each module has its own README with detailed usage, examples, and API reference.
Start with [**app**](./app) for core concepts.

## License

MIT
