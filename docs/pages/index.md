---
title: "Introduction"
description: "Learn about Mage, a modern web framework for Deno"
layout: "article"
---

# Introduction

Mage is a no-nonsense web framework for Deno. It gives you routing, middleware,
and security essentials without the magic or surprises.

## Philosophy

**No-frills.** Just the tools you need to build web applications. No
abstractions you have to learn, unlearn, or work around.

**Secure by default.** CSRF protection, CORS, CSP, rate limiting, and path
traversal prevention are built-in and ready to use.

**Simple and explicit.** Minimal abstractions mean predictable behavior. When
something goes wrong, you can debug it.

**TypeScript-native.** Full type safety without configuration. You get
autocomplete and type checking out of the box.

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

Run it:

```bash
deno run --allow-all main.ts
```

That's it. No configuration files, no build steps, no framework-specific
tooling.

## What You Get

**Core framework:**

- Routing with parameters and wildcards
- Middleware pipeline
- Type-safe context and request handling
- WebSocket support

**Security middleware:**

- CSRF protection using Fetch Metadata
- CORS configuration
- Content Security Policy
- Rate limiting with sliding window
- Security headers (HSTS, X-Frame-Options, etc.)

**Developer experience:**

- Request body size limits
- Compression
- Cookie utilities
- Schema validation (Zod, Valibot, ArkType)
- Structured logging
- Static file serving

**Bonus: Static site generator**

- Markdown with frontmatter
- Preact layouts
- File-based routing
- Hot reload in development
- Optimized production builds

## Performance

Mage handles around 50,000 requests per second on an M1 Max for simple routes.
Cold start is under 1ms for typical applications with fewer than 100 routes.

It's about 15-30% faster than Oak and about 2.5x slower than Hono. For most
applications, this won't be your bottleneck.

## Next Steps

- [Installation](/installation) - Set up your first Mage application
- [Core Concepts](/concepts) - Understand how Mage works
- [Middleware](/middleware) - Explore built-in security and utilities
