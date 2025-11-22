---
title: "Introduction"
description: "Learn about Mage, a modern web framework for Deno"
layout: "article"
---

# Introduction

Mage is a web framework for Deno that gets out of your way. No magic, no
surprises, just straightforward HTTP handling with the tools you need to build
production applications.

## What is Mage?

Mage is built around a simple idea: web frameworks should be predictable. You
define routes, add middleware, handle requests, and send responses. That's it.
No framework-specific abstractions to learn, no clever tricks that break in
production.

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

app.get("/", (c) => {
  return c.json({ message: "Simple, predictable HTTP" });
});

Deno.serve(app.handler);
```

## Why Mage?

**TypeScript-native.** Full type safety without configuration. If it compiles,
you haven't misspelled a method name or passed the wrong type.

**Security by default.** Built-in protection against path traversal, CSRF, and
other common vulnerabilities. Middleware for rate limiting, CORS, CSP, and
security headers included.

**Deno-first.** Built for Deno's runtime, using modern web standards. Works
naturally with `Deno.serve()` and deploys anywhere Deno runs.

**Batteries included.** Routing, middleware, static files, cookies, validation,
logging—the common stuff you need is already there. Add what you want, ignore
the rest.

**Debuggable.** When something goes wrong, the stack trace makes sense. No
framework gymnastics to trace through.

## Who Should Use Mage?

Mage works well if you:

- Want type safety without fighting the type system
- Prefer explicit code over framework magic
- Need security features without rolling your own
- Build APIs, static sites, or SPAs
- Deploy to Deno Deploy, Cloudflare Workers, AWS Lambda, or self-hosted
  environments

It's less ideal if you need a mature ecosystem with plugins for everything or
want an opinionated full-stack framework with ORM, auth, and admin UI built-in.

## Key Features

**Routing** - Static routes, parameters, and wildcards. Fast cold starts for
serverless deployments.

**Middleware** - CORS, CSRF, rate limiting, compression, validation, security
headers and more. Use globally or per-route.

**Static Sites** - Optional pages module with Markdown, Preact layouts,
file-based routing, and hot reload.

**Validation** - Schema validation with Zod, Valibot, or ArkType. Fully
type-safe.

**Flexible** - Bring your own database, use any Deno-compatible library.

## Example Application

Here's a simple API with middleware, validation, and error handling:

```typescript
import { MageApp, MageError } from "@mage/app";
import { cors } from "@mage/cors";
import { rateLimit } from "@mage/rate-limit";
import { validate } from "@mage/validate";
import { z } from "zod";

const app = new MageApp();

// Global middleware
app.use(cors({ origins: "*" }));
app.use(rateLimit({ max: 100, windowMs: 60000 }));

// Schema validation
const taskSchema = z.object({
  title: z.string().min(1).max(100),
});

// Routes
app.post("/tasks", validate("json", taskSchema), async (c) => {
  const task = c.req.valid("json");
  // Save task...
  return c.json(task, 201);
});

app.get("/tasks/:id", (c) => {
  const id = c.req.params.id;
  const task = findTask(id);

  if (!task) {
    throw new MageError("Task not found", 404);
  }

  return c.json(task);
});

Deno.serve(app.handler);
```

## Performance

Mage is fast enough for production use. It handles tens of thousands of requests
per second and has minimal cold start time for serverless deployments.

## Getting Started

Ready to build something?

- [Installation](/installation) - Install Deno and Mage
- [Getting Started](/getting-started) - Build your first application
- [Philosophy](/philosophy) - Understand Mage's design principles

## Project Status

Mage is under active development. The core API is stable, but expect some
changes as we refine the framework based on real-world usage. We follow semantic
versioning.

Contributions welcome at
[github.com/deno-mage/app](https://github.com/deno-mage/app).
