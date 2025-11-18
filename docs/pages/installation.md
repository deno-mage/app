---
title: "Installation"
description: "How to install and set up Mage in your Deno project"
---

# Installation

Mage is distributed via JSR (JavaScript Registry) and works with Deno's native
package management.

## Prerequisites

- [Deno](https://deno.land/) 2.0 or later

## Install from JSR

Add Mage to your project using the `deno add` command:

```bash
deno add @mage/app
```

This will add Mage to your `deno.json` imports.

## Manual Installation

Alternatively, you can manually add Mage to your `deno.json`:

```json
{
  "imports": {
    "@mage/app": "jsr:@mage/app@^0.7.0"
  }
}
```

## Verify Installation

Create a simple `main.ts` file to verify the installation:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

app.get("/", (c) => {
  c.text("Mage is working!");
});

Deno.serve({ port: 3000 }, app.handler);
```

Run your application:

```bash
deno run --allow-net main.ts
```

Visit `http://localhost:3000` to see your application running.

## Next Steps

Now that you have Mage installed, check out the
[Getting Started](getting-started) guide to build your first application.
