---
title: "Introduction"
description: "Learn about Mage, a modern web framework for Deno"
---

# Introduction

Mage is a web framework for [Deno](https://deno.com). No magic, no
surprises—just routes, middleware, and HTTP handling with
[TypeScript](https://www.typescriptlang.org) type safety.

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

app.get("/", (c) => c.json({ message: "Hello" }));

Deno.serve(app.handler);
```

## Why Mage?

- **TypeScript-native** - Full type safety without configuration
- **Security by default** - Path traversal protection, CSRF, rate limiting,
  security headers
- **Batteries included** - Routing, middleware, validation, static files
- **Fast cold starts** - Optimized for serverless (Deno Deploy, Cloudflare
  Workers, AWS Lambda)
- **Debuggable** - Clean stack traces, no framework magic

## Next Steps

- [Installation](/installation) - Install Deno and create your first app
- [Getting Started](/getting-started) - Learn routing, middleware, and error
  handling
- [Philosophy](/philosophy) - Understand Mage's design principles

## Project Status

Mage is under active development. The core API is stable, but expect changes as
we refine based on real-world usage. We follow semantic versioning.

Contribute at [github.com/deno-mage/app](https://github.com/deno-mage/app).
