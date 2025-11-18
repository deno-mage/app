---
title: "Installation"
description: "Install Mage and set up your development environment"
layout: "article"
---

# Installation

Mage is a web framework for Deno. This guide covers installation and setup for
different use cases.

## Requirements

- **Deno** 2.0 or later ([install Deno](https://deno.land/#installation))

Check your Deno version:

```bash
deno --version
```

## Basic Installation

Install Mage from JSR (JavaScript Registry):

```bash
deno add jsr:@mage/app
```

This adds Mage to your `deno.json` imports:

```json
{
  "imports": {
    "@mage/app": "jsr:@mage/app@^0.8.0"
  }
}
```

You can now import Mage in your code:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

app.get("/", (c) => {
  c.text("Hello, world!");
});

Deno.serve(app.handler);
```

Run your app:

```bash
deno run --allow-all main.ts
```

## Module Imports

Mage provides several modules through subpath imports. Each module can be
imported independently:

```typescript
// Core app
import { MageApp } from "@mage/app";

// Middleware
import { cors } from "@mage/app/cors";
import { rateLimit } from "@mage/app/rate-limit";
import { csrf } from "@mage/app/csrf";
import { compression } from "@mage/app/compression";

// Utilities
import { cookies } from "@mage/app/cookies";
import { logger } from "@mage/app/logs";

// Static site generator
import { pages } from "@mage/app/pages";
```

No additional installation is needed for these modules - they're all part of
`@mage/app`.

## Pages Module Setup

The pages module requires additional dependencies and configuration for static
site generation.

### 1. Install Dependencies

The pages module needs Preact and its renderer:

```bash
deno add npm:preact npm:preact-render-to-string
```

This adds the following to your `deno.json`:

```json
{
  "imports": {
    "@mage/app": "jsr:@mage/app@^0.8.0",
    "preact": "npm:preact@^10.24.3",
    "preact-render-to-string": "npm:preact-render-to-string@^6.5.11"
  }
}
```

### 2. Configure JSX

Add JSX configuration to your `deno.json`:

```json
{
  "imports": {
    "@mage/app": "jsr:@mage/app@^0.8.0",
    "preact": "npm:preact@^10.24.3",
    "preact-render-to-string": "npm:preact-render-to-string@^6.5.11"
  },
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

These compiler options tell TypeScript to:

- Use the modern JSX transform (`react-jsx`)
- Import JSX types and runtime from Preact

### 3. Verify Setup

Create a test file to verify the pages module works:

```typescript
import { pages } from "@mage/app/pages";

const { registerDevServer } = pages();

console.log("Pages module loaded successfully!");
```

Run it:

```bash
deno run test.ts
```

If you see "Pages module loaded successfully!" without errors, you're ready to
use the pages module.

## Project Structure

A typical Mage project looks like this:

```
my-app/
├── deno.json          # Dependencies and configuration
├── main.ts            # Application entry point
├── routes/            # Route handlers (optional)
│   └── api.ts
└── middleware/        # Custom middleware (optional)
    └── auth.ts
```

For static sites using the pages module:

```
my-site/
├── deno.json
├── docs/
│   ├── dev.ts         # Development server
│   ├── build.ts       # Build script
│   ├── serve.ts       # Production server
│   ├── pages/         # Markdown files
│   │   ├── index.md
│   │   └── guide.md
│   ├── layouts/       # Preact layouts
│   │   └── default.tsx
│   └── public/        # Static assets
│       └── styles.css
```

## Permissions

Deno requires explicit permission flags. Common flags for Mage apps:

| Flag            | Purpose               | When Needed                  |
| --------------- | --------------------- | ---------------------------- |
| `--allow-net`   | Network access        | Always (HTTP server)         |
| `--allow-read`  | Read files            | Static files, pages module   |
| `--allow-write` | Write files           | Build scripts, logs          |
| `--allow-env`   | Environment variables | Configuration, secrets       |
| `--allow-all`   | All permissions       | Development (not production) |

**Development:**

```bash
deno run --allow-all main.ts
```

**Production (minimal permissions):**

```bash
deno run --allow-net --allow-read main.ts
```

## Next Steps

- [Quick Start Guide](/quick-start) - Build your first Mage app
- [Routing](/routing) - Learn about routes and path parameters
- [Middleware](/middleware) - Add CORS, rate limiting, and security
- [Pages Module](/pages) - Build static sites with Markdown
