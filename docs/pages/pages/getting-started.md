---
title: "Getting Started with Pages"
description: "Set up your first static site with Mage Pages"
---

# Getting Started with Pages

Set up a static site with Markdown content, [Preact](https://preactjs.com)
layouts, and hot reload in minutes.

## Installation

Install Pages and its peer dependencies:

```bash
deno add jsr:@mage/app npm:preact npm:preact-render-to-string
```

This adds to your `deno.json`:

```json
{
  "imports": {
    "@mage/app": "jsr:@mage/app@^0.7.0",
    "preact": "npm:preact@^10.24.3",
    "preact-render-to-string": "npm:preact-render-to-string@^6.5.11"
  },
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

## Project Structure

Create this structure:

```
docs/
├── dev.ts
├── build.ts
├── serve.ts
├── pages/
│   └── index.md
├── layouts/
│   └── default.tsx
└── public/
    └── styles.css
```

## Create Scripts

**`docs/dev.ts`** - Development server:

```typescript
import { MageApp } from "@mage/app";
import { pages } from "@mage/app/pages";

const { registerDevServer } = pages();

const app = new MageApp();
await registerDevServer(app, { rootDir: "./docs" });

Deno.serve({ port: 3000 }, app.handler);
```

**`docs/build.ts`** - Static build:

```typescript
import { pages } from "@mage/app/pages";

const { build } = pages({
  siteMetadata: {
    baseUrl: "https://example.com",
    title: "My Site",
    description: "A simple static site",
  },
});

await build({ rootDir: "./docs" });
```

**`docs/serve.ts`** - Serve built files:

```typescript
import { MageApp } from "@mage/app";
import { pages } from "@mage/app/pages";

const { registerStaticServer } = pages();

const app = new MageApp();
registerStaticServer(app, { rootDir: "./docs/dist" });

Deno.serve({ port: 8000 }, app.handler);
```

## Add Tasks

Add to `deno.json`:

```json
{
  "tasks": {
    "docs:dev": "deno run --allow-all docs/dev.ts",
    "docs:build": "deno run --allow-read --allow-write --allow-env docs/build.ts",
    "docs:serve": "deno run --allow-read --allow-net --allow-env docs/serve.ts"
  }
}
```

## Write Content

**`docs/pages/index.md`**:

```markdown
---
title: "Home"
description: "Welcome to my site"
layout: "default"
---

# Welcome

This is my first page with Mage Pages.
```

## Create Layout

**`docs/layouts/default.tsx`**:

```tsx
import { Head, type LayoutProps } from "@mage/app/pages";

export default function DefaultLayout({
  html,
  title,
  description,
}: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
      </Head>

      <nav>
        <a href="/">Home</a>
      </nav>

      <main>
        <article
          data-mage-content="true"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
    </>
  );
}
```

## Run Your Site

```bash
# Development (with hot reload)
deno task docs:dev
# Visit http://localhost:3000

# Build static files
deno task docs:build
# Creates docs/dist/

# Serve built files
deno task docs:serve
# Visit http://localhost:8000
```

## File-Based Routing

File paths map to URLs automatically:

| File                            | URL                     |
| ------------------------------- | ----------------------- |
| `pages/index.md`                | `/`                     |
| `pages/guide.md`                | `/guide`                |
| `pages/docs/getting-started.md` | `/docs/getting-started` |

No extensions, no config needed.

Create custom 404 and 500 pages with `_not-found.md` and `_error.md`. See
[Error Pages](/pages/error-pages) for details.

## What's Next?

Add more pages and layouts:

1. Create `pages/about.md` for `/about`
2. Add navigation links to your layout
3. Create a second layout for different page types
4. Add CSS in `public/styles.css`

## Options

### Dev Server Options

```typescript
await registerDevServer(app, {
  rootDir: "./docs", // Directory with pages/ and layouts/
  basePath: "/", // Mount at this path
});
```

### Build Options

```typescript
await build({
  rootDir: "./docs", // Input directory
  outDir: "./docs/dist", // Output directory
  basePath: "/", // Base path for URLs
});
```

### Static Server Options

```typescript
registerStaticServer(app, {
  rootDir: "./docs/dist", // Directory with built files
  basePath: "/", // Mount at this path
});
```

## Notes

- Dev server watches files and triggers hot reload
- Dev server renders pages in-memory (no dist/ created)
- Build generates static HTML + client bundles
- Client bundles enable hydration for interactivity
- Missing `siteMetadata` in build throws error

## Related

- [Markdown](/pages/markdown) - Frontmatter and content format
- [Layouts](/pages/layouts) - Creating Preact layouts
- [Styles](/pages/styles) - UnoCSS setup and usage
