# pages

Simple, convention-based static site generator for Mage apps. Build static sites
from Markdown with Preact layouts and file-based routing.

## Installation

Install the pages module and its required peer dependencies:

```bash
deno add jsr:@mage/app npm:preact npm:preact-render-to-string
```

This will add the following to your `deno.json`:

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

**Note:** Preact and preact-render-to-string are required peer dependencies. The
pages module uses your project's Preact installation for rendering layouts. The
compiler options configure TypeScript to use Preact's JSX runtime.

## Quick Start

### 1. Project Structure

```
docs/
├── dev.ts           # Development server
├── build.ts         # Static build script
├── serve.ts         # Production server
├── pages/           # Markdown files
│   ├── index.md
│   └── guide.md
├── layouts/         # Preact components
│   └── default.tsx
└── public/          # Static assets (optional)
    └── styles.css
```

### 2. Configure Tasks

Add these tasks to your `deno.json`:

```json
{
  "tasks": {
    "docs:dev": "deno run --allow-all docs/dev.ts",
    "docs:build": "deno run --allow-read --allow-write --allow-env docs/build.ts",
    "docs:serve": "deno run --allow-read --allow-net --allow-env docs/serve.ts"
  }
}
```

### 3. Create Scripts

**`docs/dev.ts`** - Development server with hot reload:

```typescript
import { MageApp } from "@mage/app";
import { pages } from "@mage/app/pages";

const { registerDevServer } = pages();

const app = new MageApp();
registerDevServer(app, { rootDir: "./docs" });

Deno.serve({ port: 3000 }, app.handler);
```

**`docs/build.ts`** - Build static site:

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

**`docs/serve.ts`** - Serve built site:

```typescript
import { MageApp } from "@mage/app";
import { pages } from "@mage/app/pages";

const { registerStaticServer } = pages();

const app = new MageApp();
registerStaticServer(app, { rootDir: "./docs/dist" });

Deno.serve({ port: 8000 }, app.handler);
```

### 4. Run Your Site

```bash
# Development (with hot reload)
deno task docs:dev

# Build static files
deno task docs:build

# Serve built files
deno task docs:serve
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

Layouts are Preact components that wrap your markdown content. They support
server-side rendering for fast initial loads and client-side hydration for
interactivity.

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
        <link rel="stylesheet" href="/public/styles.css" />
      </Head>

      <nav>
        <a href="/">Home</a>
        <a href="/guide">Guide</a>
      </nav>

      <main>
        <article
          data-mage-layout="true"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
    </>
  );
}
```

**Key features:**

- Use the `<Head>` component for declarative head management
- Mark content containers with `data-mage-layout="true"` for hydration
- Return body content only (wrapped in document by `_html.tsx`)
- Supports interactive Preact components and hooks

**Layout resolution:**

1. Check frontmatter for `layout: "article"`
2. Resolve to `layouts/article.tsx`
3. If not specified, use `layouts/default.tsx`

## Client-Side Hydration

Production builds include client-side hydration for interactive components.

**How it works:**

1. Server renders static HTML (fast initial load)
2. Client JavaScript hydrates interactive components
3. Preact takes over for interactivity (state, events, etc.)

**Automatic behavior:**

- Development mode: No client bundles (just hot reload)
- Production build: Generates one bundle per page with cache-busting
- Content marked with `data-mage-layout="true"` is extracted for hydration
- Error boundaries catch failures - SSR'd content always visible

**Using interactive components:**

```tsx
import { Head, type LayoutProps } from "@mage/app/pages";
import { useState } from "preact/hooks";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicks: {count}
    </button>
  );
}

export default function InteractiveLayout(props: LayoutProps) {
  return (
    <>
      <Head>
        <title>{props.title}</title>
      </Head>

      <Counter />

      <article
        data-mage-layout="true"
        dangerouslySetInnerHTML={{ __html: props.html }}
      />
    </>
  );
}
```

### Error Handling

Hydration errors are caught automatically by error boundaries. If hydration
fails:

- SSR'd content remains visible and functional
- Interactive features won't work
- Error is logged to console for debugging
- No page crash or white screen

**Custom error UI (optional):**

```tsx
import { ErrorBoundary, Head, type LayoutProps } from "@mage/app/pages";

export default function DocsLayout(props: LayoutProps) {
  return (
    <>
      <Head>
        <title>{props.title}</title>
      </Head>

      <ErrorBoundary
        fallback={
          <div style="padding: 1rem; background: #fef2f2;">
            Interactive features unavailable. Content is still readable.
          </div>
        }
      >
        <YourInteractiveComponent />
      </ErrorBoundary>

      <article
        data-mage-layout="true"
        dangerouslySetInnerHTML={{ __html: props.html }}
      />
    </>
  );
}
```

## HTML Templates

Customize the document structure with `_html.tsx` in your project root:

```tsx
import type { HtmlTemplateProps } from "@mage/app/pages";

export default function HtmlTemplate({
  head,
  body,
  bundleUrl,
  props,
}: HtmlTemplateProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta dangerouslySetInnerHTML={{ __html: head }} />
      </head>
      <body>
        <div id="app" dangerouslySetInnerHTML={{ __html: body }} />
        {bundleUrl && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `window.__PAGE_PROPS__ = ${JSON.stringify(props)};`,
              }}
            />
            <script type="module" src={bundleUrl} />
          </>
        )}
      </body>
    </html>
  );
}
```

**Note:** The template is a Preact component that returns JSX. The DOCTYPE is
added automatically during rendering.

If `_html.tsx` is not provided, a sensible default is used.

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

## UnoCSS Support

Zero-config utility CSS generation with UnoCSS. When enabled, scans your source
files and generates optimized CSS automatically.

### Setup

Install UnoCSS dependencies:

```bash
deno add npm:@unocss/core npm:@unocss/preset-uno
```

Create `uno.config.ts` in your project root:

```typescript
import presetUno from "@unocss/preset-uno";

export default {
  presets: [presetUno()],
};
```

That's it. UnoCSS is now enabled.

### Usage

Use Tailwind-compatible utility classes in your markdown and layouts:

**In markdown:**

```markdown
<div class="container mx-auto px-4">
  <h1 class="text-4xl font-bold text-blue-600">Welcome</h1>
  <p class="text-lg text-gray-700">Your content here.</p>
</div>
```

**In layouts:**

```tsx
export default function Layout({ html, title }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <nav class="bg-gray-800 text-white p-4">
        <a href="/" class="hover:text-blue-400">Home</a>
      </nav>

      <main class="container mx-auto">
        <article
          data-mage-layout="true"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
    </>
  );
}
```

### How It Works

**Development mode:**

- Scans all source files (`.ts`, `.tsx`, `.md`, `.html`, etc.)
- Generates CSS containing only the utilities you use
- Serves from `/__styles/uno-{hash}.css`
- Automatically injected into `<head>`
- Regenerates on file changes

**Production build:**

- Single site-wide CSS bundle for all pages
- Content-hashed filename for cache-busting
- Typically 5-20KB for small-medium sites
- Includes CSS reset (preflights) and utilities

**What gets scanned:**

- ✅ All `.ts`, `.tsx`, `.js`, `.jsx` files
- ✅ All `.md`, `.mdx`, `.html` files
- ✅ Root-level files like `_html.tsx`
- ✅ Nested directories (`pages/`, `layouts/`, components, etc.)
- ❌ `dist/` and `node_modules/` are excluded

### Configuration

UnoCSS uses your `uno.config.ts` for customization:

```typescript
import presetUno from "@unocss/preset-uno";

export default {
  presets: [presetUno()],

  // Custom theme
  theme: {
    colors: {
      brand: "#3b82f6",
    },
  },

  // Custom shortcuts
  shortcuts: {
    btn: "px-4 py-2 rounded bg-brand text-white hover:bg-blue-600",
  },

  // Custom rules
  rules: [
    ["custom-rule", { color: "red" }],
  ],
};
```

See [UnoCSS documentation](https://unocss.dev) for full configuration options.

### Notes

- UnoCSS is **opt-in** - only enabled when `uno.config.ts` exists
- CSS generation happens once per build (not per page)
- If config loading fails, build continues without UnoCSS (logs error)
- Supports all UnoCSS presets and transformers
- Compatible with Tailwind CSS syntax via `@unocss/preset-uno`

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

| Option     | Type     | Default | Description                        |
| ---------- | -------- | ------- | ---------------------------------- |
| `rootDir`  | `string` | `"./"`  | Directory containing pages/layouts |
| `basePath` | `string` | `"/"`   | Base path to mount at              |

**Behavior:**

- Auto-watches files for changes
- Renders pages in-memory (no file writes)
- Hot reload on changes
- Serves assets from `public/`

### `build(options)`

Generate static site files.

**Options:**

| Option     | Type     | Default           | Description                        |
| ---------- | -------- | ----------------- | ---------------------------------- |
| `rootDir`  | `string` | `"./"`            | Directory containing pages/layouts |
| `outDir`   | `string` | `${rootDir}/dist` | Output directory for static files  |
| `basePath` | `string` | `"/"`             | Base path for URLs in built site   |

**Behavior:**

- Renders all pages to static HTML
- Copies and hashes assets to `dist/__public/`
- Generates sitemap, robots.txt (from siteMetadata)

### `registerStaticServer(app, options)`

Serve pre-built static files.

**Options:**

| Option     | Type     | Default | Description                |
| ---------- | -------- | ------- | -------------------------- |
| `rootDir`  | `string` | `"./"`  | Directory containing dist/ |
| `basePath` | `string` | `"/"`   | Base path to mount at      |

**Behavior:**

- Serves pre-built static files
- No building or watching
- Production serving

## Notes

- Layouts must export a default function
- Navigation is manually defined in layouts (no auto-generation)
- All pages are pre-rendered (no dynamic routes)
- Asset changes trigger full page reload in dev mode
- Build mode regenerates all pages every time (no incremental builds)
- URLs have no file extensions (clean URLs)
- Missing layouts or invalid frontmatter will show clear error messages
