---
title: "Installation"
description: "Install Mage and set up your development environment"
layout: "article"
---

# Installation

## Prerequisites

Mage requires [Deno](https://deno.land/) 2.0 or later.

```bash
# Install Deno (macOS/Linux)
curl -fsSL https://deno.land/install.sh | sh

# Install Deno (Windows)
irm https://deno.land/install.ps1 | iex
```

Verify your installation:

```bash
deno --version
```

## Install Mage

Add Mage to your project:

```bash
deno add @mage/app
```

This adds Mage to your `deno.json` imports and you're ready to start building.

## Verify Installation

Create a simple `main.ts` to verify everything works:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

app.get("/", (c) => {
  return c.text("Hello, Mage!");
});

Deno.serve(app.handler);
```

Run it:

```bash
deno run --allow-net main.ts
```

Visit [http://localhost:8000](http://localhost:8000) and you should see "Hello,
Mage!"

## Next Steps

Head over to [Getting Started](/getting-started) to build your first real
application.
