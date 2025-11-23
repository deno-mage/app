---
title: "Assets"
description: "Managing static files with automatic cache-busting"
---

# Assets

Pages automatically handles static assets from the `public/` directory with
cache-busting for production builds.

## Basic Usage

Place static files in `public/`:

```
docs/
├── pages/
├── layouts/
└── public/
    ├── logo.png
    ├── styles.css
    └── images/
        └── hero.jpg
```

Reference with clean URLs:

**In Markdown:**

```markdown
![Logo](/public/logo.png)

<img src="/public/images/hero.jpg" alt="Hero" />

<link rel="stylesheet" href="/public/styles.css" />
```

**In layouts:**

```tsx
export default function Layout({ html, title }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="stylesheet" href="/public/styles.css" />
      </Head>

      <nav>
        <img src="/public/logo.png" alt="Logo" />
      </nav>

      <article dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
```

## How Cache-Busting Works

**Development:**

- You write: `/public/logo.png`
- Rendered: `/public/logo.png` (no transformation)
- Served from: `public/logo.png`

**Production:**

- You write: `/public/logo.png`
- Rendered: `/__public/logo-a3f2b1c.png` (hashed)
- Output to: `dist/__public/logo-a3f2b1c.png`

**Benefits:**

- Cache files indefinitely with `Cache-Control: max-age=31536000`
- File changes generate new hashes
- Old URLs become invalid (prevents stale caches)
- No manual cache invalidation needed

## Asset Types

All files in `public/` are cache-busted:

```
public/
├── styles.css         → __public/styles-{hash}.css
├── script.js          → __public/script-{hash}.js
├── logo.png           → __public/logo-{hash}.png
├── fonts/
│   └── inter.woff2    → __public/fonts/inter-{hash}.woff2
└── data/
    └── config.json    → __public/data/config-{hash}.json
```

## Examples

### CSS Files

```tsx
export default function Layout({ html, title }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="stylesheet" href="/public/styles.css" />
        <link rel="stylesheet" href="/public/theme.css" />
      </Head>

      <article dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
```

### JavaScript Files

```tsx
export default function Layout({ html, title }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <script src="/public/analytics.js" />
      </Head>

      <article dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
```

### Images

```markdown
![Company logo](/public/logo.png)

<img
  src="/public/images/hero.jpg"
  alt="Hero image"
  width="1200"
  height="600"
/>
```

### Fonts

```css
/* public/styles.css */
@font-face {
  font-family: "Inter";
  src: url("/public/fonts/inter.woff2") format("woff2");
}
```

### Favicons

```tsx
export default function Layout({ html, title }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/public/favicon.ico" />
        <link rel="apple-touch-icon" href="/public/apple-touch-icon.png" />
      </Head>

      <article dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
```

## Nested Directories

Organize assets in subdirectories:

```
public/
├── images/
│   ├── logos/
│   │   └── brand.svg
│   └── icons/
│       └── menu.png
└── scripts/
    └── util.js
```

Reference with full paths:

```markdown
![Brand logo](/public/images/logos/brand.svg)

<script src="/public/scripts/util.js"></script>
```

## Development vs Production

**Development mode:**

- No cache-busting (clean URLs preserved)
- Served directly from `public/`
- Changes immediately visible
- No build step required

**Production build:**

- All assets hashed and copied to `dist/__public/`
- HTML updated with hashed URLs
- Original filenames lost (only hashed versions exist)
- Optimized for long-term caching

## Cache Headers

In production, serve with aggressive caching:

```typescript
// serve.ts
import { MageApp } from "@mage/app";
import { pages } from "@mage/app/pages";

const { registerStaticServer } = pages();

const app = new MageApp();

// Add cache headers for assets
app.use(async (c, next) => {
  await next();

  if (c.req.url.pathname.startsWith("/__public/")) {
    c.res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }
});

registerStaticServer(app, { rootDir: "./docs/dist" });

Deno.serve({ port: 8000 }, app.handler);
```

## Notes

- All files in `public/` are cache-busted in production
- Asset paths in HTML are rewritten automatically
- Asset changes trigger full page reload in dev
- Missing assets cause 404 (not build errors)
- No optimization (minification, compression) applied
- Use external tools (e.g., imagemin) for asset optimization
- Binary files (images, fonts) served as-is

## Related

- [Layouts](/pages/layouts) - Referencing assets in layouts
- [Markdown](/pages/markdown) - Using images in Markdown
- [Styles](/pages/styles) - UnoCSS alternative to CSS files
- [HTML Template](/pages/html-template) - Adding global assets
