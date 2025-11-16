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
import type { TemplateData } from "@mage/app/markdown-app/template.ts";

export function Layout({ title, content, navigation, basePath }: TemplateData) {
  return (
    <html>
      <head>
        <title>{title}</title>
        <link rel="stylesheet" href={`${basePath}/gfm.css`} />
      </head>
      <body>
        <nav dangerouslySetInnerHTML={{ __html: navigation.aside }} />
        <main dangerouslySetInnerHTML={{ __html: content }} />
      </body>
    </html>
  );
}
```

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
