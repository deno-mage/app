# pages

Simple, convention-based static site generator for Mage apps. Build static sites
from Markdown with Preact layouts and file-based routing.

## Installation

```typescript
import { pages } from "@mage/app/pages";
```

## Quick Start

**Project structure:**

```
docs/
├── pages/           # Markdown files
│   ├── index.md
│   └── guide.md
├── layouts/         # Preact components
│   └── default.tsx
└── public/          # Static assets
    └── styles.css
```

**Development server:**

```typescript
import { MageApp } from "@mage/app";
import { pages } from "@mage/app/pages";

const { registerDevServer } = pages({
  siteMetadata: {
    title: "My Site",
    description: "A simple static site",
  },
});

const app = new MageApp();
registerDevServer(app, { rootDir: "./docs" });

Deno.serve({ port: 3000 }, app.handler);
```

**Production build:**

```typescript
import { pages } from "@mage/app/pages";

const { build } = pages({
  siteMetadata: {
    title: "My Site",
    description: "A simple static site",
  },
});

await build({ rootDir: "./docs" });
```

## File-Based Routing

File paths map directly to URLs:

| File Path                       | URL                     |
| ------------------------------- | ----------------------- |
| `pages/index.md`                | `/`                     |
| `pages/guide.md`                | `/guide`                |
| `pages/docs/getting-started.md` | `/docs/getting-started` |

No extensions in URLs, no routing configuration needed.

## Markdown Pages

**Frontmatter** (minimal metadata):

```markdown
---
title: "Getting Started"
description: "Learn the basics"
layout: "article"
---

# Getting Started

Your markdown content here.
```

**Supported fields:**

- `title` - Page title for `<title>` tag
- `description` - Meta description
- `layout` - Layout name (optional, defaults to "default")
- Custom fields - Pass any data to your layouts

## Layouts

Layouts are Preact components that wrap your markdown content.

**Type signature:**

```typescript
interface LayoutProps {
  html: string; // Rendered content HTML
  title: string; // Page title
  description?: string; // Page description
  [key: string]: unknown; // Custom fields from frontmatter
}
```

**Example layout** (`layouts/default.tsx`):

```tsx
import type { LayoutProps } from "@mage/app/pages";

export default function DefaultLayout(
  { html, title, description }: LayoutProps,
) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        <link rel="stylesheet" href="/public/styles.css" />
      </head>
      <body>
        <nav>
          <a href="/">Home</a>
          <a href="/guide">Guide</a>
        </nav>
        <main dangerouslySetInnerHTML={{ __html: html }} />
      </body>
    </html>
  );
}
```

**Layout resolution:**

1. Check frontmatter for `layout: "article"`
2. Resolve to `layouts/article.tsx`
3. If not specified, use `layouts/default.tsx`

## Assets & Cache-Busting

Reference assets with clean URLs - cache-busting is automatic.

**In markdown:**

```markdown
![Logo](/public/images/logo.png)

<link rel="stylesheet" href="/public/styles.css">
```

**In layouts:**

```tsx
<img src="/public/images/logo.png" />
<link rel="stylesheet" href="/public/styles.css" />
```

**What happens:**

1. You write: `/public/styles.css`
2. Rendered HTML: `/__public/styles-abc123.css`
3. File location (dev): `public/styles.css`
4. File location (build): `dist/__public/styles-abc123.css`

All files in `public/` are automatically hashed and cache-busted.

## API Reference

### `pages(options)`

Factory function that returns server and build functions.

**Options:**

| Option         | Type     | Description                                |
| -------------- | -------- | ------------------------------------------ |
| `siteMetadata` | `object` | Shared metadata (title, description, etc.) |

**Returns:** `{ registerDevServer, build, registerStaticServer }`

### `registerDevServer(app, options)`

Register development server with hot reload.

**Options:**

| Option    | Type     | Default | Description                        |
| --------- | -------- | ------- | ---------------------------------- |
| `rootDir` | `string` | `"./"`  | Directory containing pages/layouts |
| `route`   | `string` | `"/"`   | Base route to mount at             |

**Behavior:**

- Auto-watches files for changes
- Renders pages in-memory (no file writes)
- Hot reload on changes
- Serves assets from `public/`

### `build(options)`

Generate static site files.

**Options:**

| Option    | Type     | Default           | Description                        |
| --------- | -------- | ----------------- | ---------------------------------- |
| `rootDir` | `string` | `"./"`            | Directory containing pages/layouts |
| `outDir`  | `string` | `${rootDir}/dist` | Output directory for static files  |

**Behavior:**

- Renders all pages to static HTML
- Copies and hashes assets to `dist/__public/`
- Generates sitemap, robots.txt (from siteMetadata)

### `registerStaticServer(app, options)`

Serve pre-built static files.

**Options:**

| Option    | Type     | Default | Description                |
| --------- | -------- | ------- | -------------------------- |
| `rootDir` | `string` | `"./"`  | Directory containing dist/ |
| `route`   | `string` | `"/"`   | Base route to mount at     |

**Behavior:**

- Serves pre-built static files
- No building or watching
- Production serving

## Usage Patterns

### Development Workflow

```typescript
import { MageApp } from "@mage/app";
import { pages } from "@mage/app/pages";

const { registerDevServer } = pages({
  siteMetadata: { title: "My Docs" },
});

const app = new MageApp();
registerDevServer(app, { rootDir: "./docs" });

Deno.serve({ port: 3000 }, app.handler);
```

Start server, edit markdown/layouts, see changes instantly.

### CI/CD Build

```typescript
import { pages } from "@mage/app/pages";

const { build } = pages({
  siteMetadata: { title: "My Docs" },
});

await build({
  rootDir: "./docs",
  outDir: "./dist",
});
```

Run in CI to generate static files for deployment.

### Production Server

```typescript
import { MageApp } from "@mage/app";
import { pages } from "@mage/app/pages";

const { registerStaticServer } = pages({
  siteMetadata: { title: "My Docs" },
});

const app = new MageApp();
registerStaticServer(app, { rootDir: "./dist" });

Deno.serve({ port: 8000 }, app.handler);
```

Serve pre-built static files in production.

### Mixed Application

Combine with other Mage routes:

```typescript
import { MageApp } from "@mage/app";
import { pages } from "@mage/app/pages";

const app = new MageApp();

// API routes
app.get("/api/users", (c) => c.json({ users: [] }));

// Docs site
const { registerStaticServer } = pages({
  siteMetadata: { title: "API Docs" },
});
registerStaticServer(app, {
  rootDir: "./docs/dist",
  route: "/docs",
});

Deno.serve(app.handler);
```

## Notes

- Layouts must export a default function
- Navigation is manually defined in layouts (no auto-generation)
- All pages are pre-rendered (no dynamic routes)
- Asset changes trigger full page reload in dev mode
- Build mode regenerates all pages every time (no incremental builds)
- URLs have no file extensions (clean URLs)
- Missing layouts or invalid frontmatter will show clear error messages
