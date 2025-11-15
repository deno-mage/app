<p align="center" style="color: #343a40">
  <img src="https://raw.githubusercontent.com/deno-mage/server/main/mage.png" alt="Emotion logo" height="150" width="150">
  <h1 align="center">Mage</h1>
</p>
<div align="center">
  Build web applications with <a href="https://deno.com">Deno</a>
</div>

## Overview

Mage is a web application framework for Deno designed for **serverless and edge
computing**. It emphasizes simplicity, security, and performance for modern
deployments.

**Philosophy:**

- **Serverless-first** - Zero cold start overhead, optimized for AWS Lambda,
  Cloudflare Workers, Deno Deploy
- **Security by default** - Built-in CSRF, CORS, CSP, rate limiting, and path
  traversal protection
- **Simple and explicit** - Minimal abstractions, predictable behavior, easy to
  debug
- **TypeScript-native** - Full type safety without configuration

## Quick Start

```sh
deno add jsr:@mage/app
```

**Hello World:**

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

app.get("/", (c) => {
  c.text("Hello, world!");
});

Deno.serve(app.handler);
```

Run: `deno run --allow-all main.ts`

## Core Concepts

### Middleware

Middleware functions receive a context object and `next()` function:

```typescript
app.use(async (c, next) => {
  console.log(`${c.req.method} ${c.req.url.pathname}`);
  await next(); // Pass control to next middleware
  console.log(`Response: ${c.res.status}`);
});
```

### Context (c)

The context object persists throughout the request/response cycle:

```typescript
app.get("/users/:id", async (c) => {
  // Request
  const userId = c.req.params.id;
  const token = c.req.header("Authorization");

  // Response
  c.json({ userId }, 200);
  c.header("X-Custom", "value");

  // Data storage across middleware
  c.set("user", await getUser(userId));
  const user = c.get<User>("user");
});
```

### Routing

Simple, express-like routing with path parameters and wildcards:

```typescript
app.get("/users", listUsers);
app.get("/users/:id", getUser);
app.post("/users", createUser);
app.all("/admin/*", requireAuth, handleAdmin);
```

## Modules

| Module                                     | Description                       |
| ------------------------------------------ | --------------------------------- |
| [**app**](./app)                           | Core framework (routing, context) |
| [**linear-router**](./linear-router)       | Default O(n) router (serverless)  |
| [**body-size**](./body-size)               | Limit request body size           |
| [**cache-control**](./cache-control)       | Set Cache-Control headers         |
| [**compression**](./compression)           | Gzip response compression         |
| [**cookies**](./cookies)                   | Signed cookie utilities           |
| [**cors**](./cors)                         | CORS request handling             |
| [**csp**](./csp)                           | Content Security Policy           |
| [**csrf**](./csrf)                         | CSRF protection (Fetch Metadata)  |
| [**logs**](./logs)                         | Structured logging                |
| [**rate-limit**](./rate-limit)             | Sliding window rate limiting      |
| [**request-id**](./request-id)             | Request ID tracking and tracing   |
| [**security-headers**](./security-headers) | Common security headers           |
| [**serve-files**](./serve-files)           | Static file serving               |
| [**status**](./status)                     | HTTP status utilities             |
| [**timeout**](./timeout)                   | Request timeout enforcement       |
| [**validate**](./validate)                 | Standard Schema validation        |

Each module is independently importable:

```typescript
import { MageApp } from "@mage/app";
import { cors } from "@mage/app/cors";
import { rateLimit } from "@mage/app/rate-limit";
```

## Performance

### Benchmarks

**Test Environment:**

- Hardware: Apple M1 Max, 64GB RAM
- Deno: v2.5.6 (stable)
- Tool: bombardier v2.0.2 (`--fasthttp -d 10s -c 100`)

**Results:**

| Test                 | Req/sec | Latency (avg) | Throughput |
| -------------------- | ------- | ------------- | ---------- |
| Simple text response | 53,995  | 1.85ms        | 11.07 MB/s |
| Route with parameter | 49,515  | 2.02ms        | 11.05 MB/s |
| JSON response        | 52,373  | 1.91ms        | 11.94 MB/s |

**What this means:**

- Handles 4.3+ billion requests per day
- ~15-30% faster than Oak (most popular Deno framework)
- ~2.5x slower than Hono (fastest Deno framework)
- Performance won't be a bottleneck for 99.9% of applications

**Cold start:** < 1ms for typical applications (< 100 routes)

**Optimized for:**

- Serverless functions (AWS Lambda, Cloudflare Workers, Deno Deploy)
- Edge computing with frequent cold starts
- Applications prioritizing startup time and maintainability over peak
  throughput

See [benchmarks/framework-comparison.md](./benchmarks/framework-comparison.md)
for detailed analysis.

## Example Application

```typescript
import { MageApp } from "@mage/app";
import { cors } from "@mage/app/cors";
import { rateLimit } from "@mage/app/rate-limit";
import { csrf } from "@mage/app/csrf";
import { requestId } from "@mage/app/request-id";
import { validate } from "@mage/app/validate";
import { z } from "zod";

const app = new MageApp();

// Global middleware
app.use(requestId());
app.use(cors());
app.use(csrf());
app.use(rateLimit({ max: 100, windowMs: 60000 }));

// Routes with validation
const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

app.post("/users", validate("json", userSchema), async (c) => {
  const data = c.req.valid<{ name: string; email: string }>("json");
  const user = await createUser(data);
  c.json(user, 201);
});

app.get("/users/:id", async (c) => {
  const user = await getUser(c.req.params.id);
  if (!user) {
    c.notFound();
    return;
  }
  c.json(user);
});

Deno.serve(app.handler);
```

## Documentation

See individual module READMEs for detailed documentation and examples.
