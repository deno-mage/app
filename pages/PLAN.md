# Pages Module - Implementation Plan

## Overview

A simple, convention-based static site generator for Mage apps. Build static
sites from Markdown content with Preact layouts, file-based routing, and
automatic asset cache-busting.

## Core Design Principles

1. **Convention over configuration** - Fixed folder structure, predictable
   behavior
2. **File-based routing** - File path = URL path, no routing config
3. **Minimal frontmatter** - Metadata only, no navigation config
4. **Manual navigation** - Layouts define nav structure explicitly
5. **Static-first** - Pre-render everything, keep it naive

## Folder Structure

```
project/
├── pages/       # Markdown files (file path = route)
├── layouts/     # Preact components
├── public/      # Static assets
└── dist/        # Build output (generated)
```

### File-Based Routing

- `pages/index.md` → `/`
- `pages/middleware/csrf.md` → `/middleware/csrf`
- `pages/docs/getting-started.md` → `/docs/getting-started`
- No file extensions in URLs
- No `[slug]` dynamic routes (not needed yet)

## Frontmatter

Minimal metadata only:

```yaml
---
title: "Page Title"
description: "Meta description"
layout: "article" # Optional, defaults to "default"
customField: "any custom data"
---
```

**Key points:**

- NO navigation config (removed entirely)
- `layout` is a name, not a path: `"article"` → `layouts/article.tsx`
- Default layout: `layouts/default.tsx`
- Supports custom fields for passing data to layouts

## Layout System

### Layout Props

```typescript
interface LayoutProps {
  /** Rendered HTML content */
  html: string;
  /** Page title for <title> tag */
  title: string;
  /** Page description for meta tags */
  description?: string;
  /** Custom metadata fields from frontmatter */
  [key: string]: unknown;
}

interface Frontmatter {
  /** Page title for <title> tag */
  title: string;
  /** Page description for meta tags */
  description?: string;
  /** Layout name (resolves to layouts/{layout}.tsx) */
  layout?: string;
  /** Allow custom fields */
  [key: string]: unknown;
}
```

### Layout Resolution

1. Check frontmatter for `layout` field
2. If present: resolve to `layouts/{layout}.tsx`
3. If not present: use `layouts/default.tsx`
4. If default doesn't exist: error

### Layout Behavior

- Layouts are Preact components
- Manually define ALL navigation
- Consumers can create shared nav components if desired
- Full Preact power for structure

## Asset Management

### The Problem

- Need cache-busting for assets (styles, images, etc.)
- Assets referenced in both markdown AND Preact layouts
- Can't use `asset()` function in markdown

### The Solution: Post-Render Replacement

**Flow:**

1. Hash all files in `public/`
2. Build asset map: `/public/styles.css` → `/__public/styles-abc123.css`
3. Authors reference clean URLs: `/public/styles.css`
4. After rendering full HTML, replace ALL `/public/*` → `/__public/*-[hash].*`
5. Serve from `/__public/*` routes

**Dev Mode:**

```
public/styles.css                      # Source (stays here)
↓
Hash → abc123
↓
Asset map: /public/styles.css → /__public/styles-abc123.css
↓
Route: /__public/styles-abc123.css → c.file("public/styles.css")
```

**Build Mode:**

```
public/styles.css                      # Source
↓
Copy → dist/__public/styles-abc123.css # Hashed copy
↓
Asset map: /public/styles.css → /__public/styles-abc123.css
↓
HTML replacement before writing
```

**URL Mapping:**

- **Written in markdown/layouts:** `/public/styles.css` (clean)
- **Rendered in HTML:** `/__public/styles-abc123.css` (hashed)
- **Served from:** `/__public/` routes

**Implementation:**

```typescript
// Asset map built from public/
const assetMap = new Map([
  ["/public/styles.css", "/__public/styles-abc123.css"],
  ["/public/images/logo.png", "/__public/images/logo-def456.png"],
]);

// Post-process HTML
for (const [cleanUrl, hashedUrl] of assetMap) {
  const pattern = new RegExp(`(['"\(])${escapeRegex(cleanUrl)}`, "g");
  html = html.replace(pattern, `$1${hashedUrl}`);
}
```

### Asset Watching (Dev Mode)

- Watch `public/` for changes
- On change: re-hash file, update asset map, trigger page reload
- Simple naive approach: reload entire page

## Developer Experience

### Three Clear Modes

**1. Development Server** (in-memory, hot reload)

```typescript
import { MageApp } from "@mage/app";
import { pages } from "@mage/app/pages";

const { registerDevServer } = pages({
  siteMetadata: {
    title: "My Site",
    description: "...",
  },
});

const app = new MageApp();

registerDevServer(app, {
  rootDir: "./docs", // Optional, defaults to "./"
  route: "/", // Optional, defaults to "/"
});

Deno.serve({ port: 3000 }, app.handler);
```

- Auto-watches `pages/`, `layouts/`, `public/`
- Renders in-memory (no file writes)
- Serves via `c.html()` for pages
- Serves via `c.file()` for assets (from `public/`)
- Hot reload on changes

**2. Static Build** (generate files)

```typescript
import { pages } from "@mage/app/pages";

const { build } = pages({
  siteMetadata: {
    title: "My Site",
    description: "...",
  },
});

await build({
  rootDir: "./docs", // Optional, defaults to "./"
  outDir: "./docs/dist", // Optional, defaults to ${rootDir}/dist
});
```

- Scan `pages/`, render all markdown
- Copy `public/` → `dist/__public/` (with hashes)
- Write HTML files to `dist/`
- Generate sitemap, robots.txt, etc. (from siteMetadata)

**3. Static Server** (serve pre-built files)

```typescript
import { MageApp } from "@mage/app";
import { pages } from "@mage/app/pages";

const { registerStaticServer } = pages({
  siteMetadata: {
    title: "My Site",
    description: "...",
  },
});

const app = new MageApp();

registerStaticServer(app, {
  rootDir: "./docs/dist", // Optional, defaults to "./"
  route: "/", // Optional, defaults to "/"
});

Deno.serve({ port: 3000 }, app.handler);
```

- Serve pre-built static files
- No building, just file serving
- Production mode

## Implementation Tasks

### Phase 1: Core Types & Parsing

- [ ] Define TypeScript interfaces (LayoutProps, Frontmatter, Options)
- [ ] Implement markdown parser with frontmatter extraction
- [ ] Implement layout resolver (named layouts + default convention)

### Phase 2: Asset Management

- [ ] Implement asset hashing (hash files in `public/`)
- [ ] Build asset map (`/public/*` → `/__public/*-[hash].*`)
- [ ] Implement post-render HTML replacement
- [ ] Implement asset file watching (dev mode)

### Phase 3: Build Pipeline

- [ ] Implement page scanner (find all `.md` files in `pages/`)
- [ ] Implement markdown → HTML renderer
- [ ] Implement layout wrapper (HTML + props → full page)
- [ ] Implement static build (`build()` function)
- [ ] Copy and hash assets to `dist/__public/`

### Phase 4: Dev Server

- [ ] Implement file watching (pages, layouts, public)
- [ ] Implement in-memory rendering
- [ ] Register routes for pages (serve via `c.html()`)
- [ ] Register routes for assets (serve via `c.file()`)
- [ ] Implement hot reload (simple page reload)

### Phase 5: Static Server

- [ ] Implement static file serving from `dist/`
- [ ] Register routes for pages
- [ ] Register routes for assets from `dist/__public/`

### Phase 6: Polish

- [ ] Error handling (missing layouts, invalid frontmatter, etc.)
- [ ] 404 page handling
- [ ] Sitemap/robots.txt generation (from siteMetadata)
- [ ] Tests
- [ ] Documentation
- [ ] Example app

## Technical Details

### Markdown Rendering

- Use `@deno/gfm` for GitHub Flavored Markdown
- Syntax highlighting for code blocks
- Auto-detect languages or use defaults

### File Watching

- Watch `pages/`, `layouts/`, `public/` directories
- On change: re-render affected pages (or all pages for simplicity)
- Trigger browser reload (WebSocket or simple polling)

### Route Registration

**Dev server:**

- Pages: `GET /:path*` → render markdown + layout → `c.html()`
- Assets: `GET /__public/:path*` → resolve hash → `c.file("public/:path")`

**Static server:**

- Pages: `GET /:path*` → serve from `dist/:path/index.html`
- Assets: `GET /__public/:path*` → serve from `dist/__public/:path`

### Error Handling

- Missing layout file → clear error
- Invalid frontmatter → show which file, what's wrong
- File read errors → show path and error
- Markdown parse errors → show file and line

### Performance

- Dev mode: Re-render only changed pages (nice-to-have, not required)
- Build mode: Render all pages every time (simple, naive)
- Asset hashing: Cache hashes between builds (dev mode only)

## Future Considerations (Not in Scope)

- Dynamic routes (`[slug]` patterns)
- Incremental builds
- MDX support
- RSS feed generation
- Search index generation
- Image optimization
- Smart hot reload (patch DOM instead of full reload)

## Success Criteria

1. Clean, simple API (three clear modes)
2. File-based routing works intuitively
3. Asset cache-busting works in markdown and layouts
4. Dev mode has hot reload
5. Build mode generates clean static site
6. Error messages are clear and actionable
7. Documentation is complete and clear
8. Example app demonstrates all features
