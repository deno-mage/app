---
title: "Pages Overview"
description: "Static site generator for Mage with Markdown, Preact layouts, and file-based routing"
---

# Pages Overview

Pages is a static site generator for Mage apps. Write content in Markdown, wrap
it in [Preact](https://preactjs.com) layouts, and deploy as static HTML with
client-side hydration for interactivity.

## What is Pages?

Pages generates static sites from Markdown files with:

- **File-based routing** - File paths map directly to URLs (no config)
- **[Preact](https://preactjs.com) layouts** - Wrap content in interactive
  components
- **Client-side hydration** - SSR for speed, hydration for interactivity
- **Hot reload** - Development server with instant updates
- **[UnoCSS](https://unocss.dev) support** - Zero-config utility CSS generation
- **Asset optimization** - Automatic cache-busting for static files

## When to Use Pages

Pages works well for:

- Documentation sites
- Marketing sites
- Blogs
- Project portfolios
- Landing pages

Pages is **not** for:

- Dynamic applications (use MageApp directly)
- Server-side rendering with dynamic data
- Applications requiring user authentication
- Real-time features

## How It Works

**Development:**

1. Write Markdown files in `pages/`
2. Create Preact layouts in `layouts/`
3. Run dev server with hot reload
4. Pages renders in-memory on each request

**Production:**

1. Run build command
2. Pages renders all pages to static HTML
3. Bundles client JavaScript for hydration
4. Hashes assets for cache-busting
5. Generates sitemap and robots.txt
6. Outputs to `dist/` directory

## Architecture

```
docs/
├── pages/          # Markdown content
│   ├── index.md
│   └── guide.md
├── layouts/        # Preact components
│   └── default.tsx
├── public/         # Static assets
│   └── logo.png
├── _html.tsx       # Document template (optional)
├── dev.ts          # Dev server script
├── build.ts        # Build script
└── serve.ts        # Static server script
```

**Rendering flow:**

1. Markdown → HTML (with frontmatter extraction)
2. HTML + Layout → Rendered page
3. `_html.tsx` wraps everything in document structure
4. Client bundle hydrates interactive components

## Key Concepts

**File-based routing:**

- `pages/index.md` → `/`
- `pages/guide.md` → `/guide`
- `pages/docs/getting-started.md` → `/docs/getting-started`

**Frontmatter:**

```markdown
---
title: "Page Title"
description: "Page description"
---

# Content here
```

**Layouts:**

Preact components that receive `{ html, title, description }` and wrap content.

**Hydration:**

Server renders static HTML. Client JavaScript hydrates for interactivity. If
hydration fails, content remains visible.

## Next Steps

- [Getting Started](/pages/getting-started) - Set up your first pages site
- [Markdown](/pages/markdown) - Writing content with frontmatter
- [Layouts](/pages/layouts) - Creating Preact layouts
- [Styles](/pages/styles) - Using UnoCSS for styling

## Related

- [MageApp](/core/mage-app) - Core Mage framework
- [Installation](/installation) - Install Mage and dependencies
