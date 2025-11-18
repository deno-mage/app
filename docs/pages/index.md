---
title: "Mage - Simple, Fast Web Framework for Deno"
description: "A simple, fast web framework for Deno with built-in middleware and TypeScript support"
---

# Mage

A simple, fast web framework for Deno with built-in middleware and TypeScript
support.

## Features

- **Simple API** - Clean, intuitive routing and middleware system
- **TypeScript-first** - Full type safety with zero configuration
- **Built-in middleware** - Compression, CORS, CSRF, security headers, and more
- **Fast** - Optimized for performance with minimal overhead
- **Modular** - Use only what you need

## Quick Start

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

app.get("/", (c) => {
  c.text("Hello, Mage!");
});

Deno.serve(app.handler);
```

## Documentation

- [Installation](installation) - Get started with Mage
- [Getting Started](getting-started) - Build your first application
