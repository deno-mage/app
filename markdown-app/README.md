# markdown-app

Build documentation sites from markdown with YAML frontmatter. Hot reload in
dev, static HTML in production.

## Installation

```typescript
import { markdownApp } from "@mage/app/markdown-app";
```

## Usage

```typescript
const app = new MageApp();
const { register, watch, build } = markdownApp({
  sourceDir: "./docs",
  outputDir: "./dist",
  layoutDir: "./docs",
  basePath: "/", // URL prefix
  dev: true, // Enable hot reload
});

// Development
register(app);
Deno.serve({ port: 3000 }, app.handler);
await watch();

// Production
await build();
```

## Frontmatter

```yaml
---
title: Getting Started              # Required
slug: getting-started               # Required: [a-z0-9-/], unique
layout: docs                        # Required: [a-z0-9-]
nav-item: Guide/Getting Started     # Optional: "Item" or "Section/Item"
nav-group: aside                    # Optional: default, aside, header, footer
nav-order: 1                        # Optional: sort order (default: 999)
---
```

## Layouts

Create `_layout-{name}.tsx` files:

```tsx
import type { LayoutProps } from "@mage/app/markdown-app";

export function Layout({ title, articleHtml, navigation, asset }: LayoutProps) {
  return (
    <html>
      <head>
        <title>{title}</title>
        <link rel="stylesheet" href={asset("gfm.css")} />
        <link rel="stylesheet" href={asset("main.css")} />
      </head>
      <body>
        <nav dangerouslySetInnerHTML={{ __html: navigation.aside }} />
        <main dangerouslySetInnerHTML={{ __html: articleHtml }} />
      </body>
    </html>
  );
}
```

### asset() Function

The `asset(path)` function generates URLs for static assets with automatic
cache-busting. All assets in the `assets/` directory are hashed:

- `asset("main.css")` → `/__assets/main-a3f2b1c8.css`
- `asset("logo.svg")` → `/__assets/logo-f4e3d2a1.svg`
- `asset("js/app.js")` → `/__assets/js/app-b2c4e6f8.js`

For generated files (like `gfm.css`), it combines with basePath:

- `asset("gfm.css")` → `/gfm.css` (or `/docs/gfm.css` with basePath)

Always use `asset()` for all asset references to ensure correct paths and
cache-busting.

## Assets

Reference with `{{assets}}/path`:

```markdown
![Logo]({{assets}}/logo.png)
```

Copied to `__assets/` with SHA-256 hash for cache-busting.

## Options

| Option                     | Type       | Default                                  | Description                       |
| -------------------------- | ---------- | ---------------------------------------- | --------------------------------- |
| `sourceDir`                | `string`   | (required)                               | Markdown source files             |
| `outputDir`                | `string`   | (required)                               | Build output directory            |
| `layoutDir`                | `string`   | (required)                               | TSX/HTML layout files             |
| `basePath`                 | `string`   | `"/"`                                    | URL prefix                        |
| `dev`                      | `boolean`  | `false`                                  | Enable hot reload                 |
| `syntaxHighlightLanguages` | `string[]` | `["typescript", "bash", "json", "yaml"]` | Prism language components         |
| `siteMetadata`             | `object`   | `undefined`                              | Generates sitemap/robots/manifest |
| `assetsDir`                | `string`   | `"assets"`                               | Static assets directory           |

### SiteMetadata

Generates `sitemap.xml`, `robots.txt`, and `manifest.webmanifest`:

```typescript
{
  siteUrl: "https://example.com",  // Required
  siteName: "My Docs",
  description: "Documentation",
  themeColor: "#1e40af",
  icon192Path: "icon-192.png",
  icon512Path: "icon-512.png",
}
```

## Security

- Path traversal blocked (`..` in slug/layout)
- Duplicate slugs cause build failure
- basePath validated (must start with `/`)
- All inputs validated with clear error messages

## Notes

- **BYO Styles:** Only `gfm.css` provided
- **Full rebuilds:** Every change rebuilds all pages
- **Navigation:** Only pages with `nav-item` appear
- **Hot reload:** Start server before `watch()`, changes during builds are
  queued
- **Performance:** ~500ms for 100 pages
