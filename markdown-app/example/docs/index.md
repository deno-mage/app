---
title: Welcome to Example Docs
slug: index
layout: docs
nav: Home
nav-order: 1
---

# Welcome to Example Docs!

This is an example documentation site built with **Mage Markdown App**.

## Features

- 📝 Markdown-driven content
- 🔥 Hot reload in development
- 🎨 Bring your own styles
- ⚡ Static HTML generation
- 🧭 Auto-generated navigation

## Quick Start

Check out the [Getting Started](/getting-started) guide to learn more.

You can also explore the [API Reference](/api) to see what's available.

## Code Example

```typescript
import { MageApp } from "@mage/app";
import { markdownApp } from "@mage/app/markdown-app";

const app = new MageApp();

const { register, watch } = markdownApp({
  sourceDir: "./docs",
  outputDir: "./docs/_site",
  layoutDir: "./docs",
  basePath: "/",
  dev: true,
});

register(app);
await watch();

Deno.serve(app.handler);
```

Simple, right?
