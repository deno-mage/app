# Markdown App

Build documentation sites with Mage and markdown. Write content in markdown with
YAML frontmatter, serve with hot reload during development, and build to static
HTML for deployment.

## Overview

The Markdown App module provides a complete system for building documentation
and content sites using markdown files. It's designed for dogfooding Mage itself
(serving its own documentation) and follows a BYO-Styles (Bring Your Own Styles)
philosophy - you control the design.

**Key features:**

- YAML frontmatter for metadata (title, slug, layout, navigation)
- GitHub Flavored Markdown with configurable syntax highlighting
- Auto-generated navigation from frontmatter
- Hot reload during development via WebSocket
- Build to static HTML for deployment
- Simple `{{key}}` template engine
- Multiple layout support
- Path traversal protection

## Installation

```typescript
import { markdownApp } from "@mage/markdown-app";
```

## Quick Start

**Development server:**

```typescript
import { MageApp } from "@mage/app";
import { markdownApp } from "@mage/markdown-app";

const app = new MageApp();
const { register, watch } = markdownApp({
  sourceDir: "./docs",
  outputDir: "./dist",
  layoutDir: "./docs",
  basePath: "/",
  dev: true,
});

register(app);
Deno.serve({ port: 3000 }, app.handler);
await watch(); // Start watching for changes
```

**Production build:**

```typescript
const { build } = markdownApp({
  sourceDir: "./docs",
  outputDir: "./dist",
  layoutDir: "./docs",
  basePath: "/",
  dev: false,
});

await build();
```

See the [example directory](./example/) for a complete working setup.

## Project Structure

See [example/](./example/) for the complete structure. Basic layout:

```
your-project/
├── docs/                  # Source markdown files
│   ├── *.md              # Markdown content
│   └── _layout-*.html    # Layout templates
├── dist/                  # Built HTML (generated)
└── serve.ts              # Development server
```

## Frontmatter

Every markdown file must have YAML frontmatter:

### Required Fields

```yaml
---
title: Getting Started     # Page title
slug: getting-started      # URL path (no leading /, no ..)
layout: docs               # Layout file to use (_layout-docs.html)
---
```

### Optional Fields

```yaml
---
title: Getting Started
slug: getting-started
layout: docs
nav-item: Guide/Getting Started # Navigation section/item
nav-group: aside                # Navigation group (aside, header, footer, etc.)
nav-order: 1                    # Sort order (lower = first)
---
```

### Examples

**Simple page:**

```yaml
---
title: Getting Started
slug: getting-started
layout: docs
---

# Getting Started
Your content here...
```

**Page with navigation:**

```yaml
---
title: CORS Middleware
slug: middleware/cors
layout: docs
nav-item: Middleware/CORS
nav-group: aside
nav-order: 1
---
```

See [example/docs/](./example/docs/) for more examples.

## Layouts

Layout files are HTML templates with `{{key}}` placeholders.

### Available Template Variables

- `{{title}}` - Page title from frontmatter
- `{{content}}` - Rendered markdown HTML
- `{{navigation.groupName}}` - Auto-generated navigation for a specific group
  (e.g., `{{navigation.aside}}`, `{{navigation.header}}`)
- `{{basePath}}` - Base path for URLs (empty string if `/`)

### Layout Example

**Minimal layout:**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>{{title}}</title>
    <link rel="stylesheet" href="{{basePath}}/gfm.css">
  </head>
  <body>
    <nav>{{navigation.aside}}</nav>
    <main>{{content}}</main>
  </body>
</html>
```

**Layout naming convention:**

- Layout files start with `_layout-` prefix
- Frontmatter `layout: docs` → `_layout-docs.html`
- Frontmatter `layout: blog` → `_layout-blog.html`

See [example/docs/_layout-docs.html](./example/docs/_layout-docs.html) for a
styled example with Pico CSS.

## Navigation

Navigation is automatically generated from pages with `nav-item` and `nav-group`
frontmatter fields. This allows you to create multiple navigation areas
(sidebar, header, footer) from the same set of markdown files.

### Grouped Navigation

Each page can specify which navigation group it belongs to:

```yaml
---
title: Getting Started
slug: getting-started
layout: docs
nav-item: Guide/Getting Started  # Section/Item format
nav-group: aside                 # Which nav group this belongs to
nav-order: 1                     # Sort order within group
---
```

**Common navigation groups:**

- `aside` - Sidebar navigation for docs
- `header` - Top navigation links
- `footer` - Footer links
- `default` - Default group if not specified

In your layout template, access each group using dot notation:

```html
<aside>
  {{navigation.aside}}
</aside>

<header>
  {{navigation.header}}
</header>

<footer>
  {{navigation.footer}}
</footer>
```

### Nav Item Format

The `nav-item` field supports two formats:

```yaml
nav-item: Introduction # Unsectioned item
nav-item: Guide/Getting Started # Sectioned item (Section/Item)
```

Sections generate semantic HTML with `<section>`, `<h3>`, and `<ul>` elements:

```html
<nav>
  <section>
    <h3>Guide</h3>
    <ul>
      <li><a href="/getting-started">Getting Started</a></li>
    </ul>
  </section>
</nav>
```

### Navigation Sorting

Items sorted by `nav-order` (ascending), alphabetically for ties:

```yaml
nav-order: 1 # First
nav-order: 2 # Second
# (no order)  # Defaults to 999 (last)
```

Sections are also sorted by the lowest `nav-order` of their items.

### Current Page

The current page link includes `data-current="true"` for styling:

```css
nav a[data-current="true"] {
  font-weight: bold;
}
```

## Static Assets

The Markdown App includes automatic asset management with cache busting for
optimal performance.

### Asset Directory

By default, assets are placed in the `assets/` directory relative to your
project root. During build, they are copied to `dist/__assets/` to avoid
conflicts with page routes. This can be customized via the `assetsDir` option.

```
your-project/
├── assets/             # Source assets (configurable)
│   ├── icon.svg
│   ├── images/
│   │   └── logo.png
│   └── styles.css
├── docs/               # Markdown files
└── dist/               # Built output
    └── __assets/       # Built assets (fixed path)
        ├── icon-a3f2b1c8.svg
        ├── images/
        │   └── logo-d4e5f6a7.png
        └── styles-f1e2d3c4.css
```

### Cache Busting

Assets are automatically copied to `__assets/` in the output directory with
content-based hashes in their filenames:

- `assets/icon.svg` → `dist/__assets/icon-a3f2b1c8.svg`
- `assets/images/logo.png` → `dist/__assets/images/logo-d4e5f6a7.png`
- `assets/styles.css` → `dist/__assets/styles-f1e2d3c4.css`

Hashes are generated using SHA-256 (first 8 characters), ensuring that file
changes always produce new URLs for cache invalidation.

### Using Assets in Markdown

Reference assets using the `{{assets}}` placeholder:

```markdown
---
title: Getting Started
slug: getting-started
layout: docs
---

# Getting Started

![Logo]({{assets}}/images/logo.png)

Check out our [icon]({{assets}}/icon.svg)!
```

The placeholder will be replaced with the cache-busted URL during build:

```html
<img src="/__assets/images/logo-d4e5f6a7.png" alt="Logo">
<a href="/__assets/icon-a3f2b1c8.svg">icon</a>
```

### Using Assets in Layout Templates

Assets work in layout templates too:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>{{title}}</title>
    <link rel="stylesheet" href="{{assets}}/styles.css">
    <link rel="icon" href="{{assets}}/icon.svg">
  </head>
  <body>
    {{content}}
  </body>
</html>
```

Note: `{{assets}}` replacement happens in **markdown content only**, not in
layout templates. For layouts, reference assets with direct paths or place
critical assets directly in the output directory.

### Icons for PWA Manifest

When using `siteMetadata` for PWA support, you can reference assets in the icon
paths:

```typescript
const { build } = markdownApp({
  sourceDir: "./docs",
  outputDir: "./dist",
  layoutDir: "./docs",
  basePath: "/",
  dev: false,
  siteMetadata: {
    siteUrl: "https://example.com",
    siteName: "My Docs",
    // Reference assets that will be cache-busted
    icon192Path: "icon-192.png", // From __assets/icon-192.png
    icon512Path: "icon-512.png", // From __assets/icon-512.png
  },
});
```

The manifest will automatically use cache-busted paths if the icons are found in
the assets directory.

### Configuration

Customize the assets directory location:

```typescript
const { build } = markdownApp({
  sourceDir: "./docs",
  outputDir: "./dist",
  layoutDir: "./docs",
  basePath: "/",
  dev: false,
  assetsDir: "./static", // Default: "__assets"
});
```

### Behavior

- **Missing assets directory**: Build continues without error, logs info message
- **Missing asset reference**: Placeholder left unchanged, warning logged
- **Directory structure**: Preserved under `__assets/` (e.g.,
  `assets/images/logo.png` → `dist/__assets/images/logo-hash.png`)
- **Consistent hashing**: Same content always produces same hash across builds
- **URL prefix**: All asset URLs include `/__assets/` to avoid route conflicts

## Production Files

The build process can automatically generate production-ready files for SEO and
PWA support.

### Generated Files

When `siteMetadata` is provided in build options, the following files are
automatically generated:

1. **`sitemap.xml`** - XML sitemap for search engines
2. **`robots.txt`** - Crawler directives + sitemap reference
3. **`manifest.webmanifest`** - PWA manifest for "Add to Home Screen"

### Site Metadata Configuration

```typescript
import { markdownApp } from "@mage/markdown-app";

const { build } = markdownApp({
  sourceDir: "./docs",
  outputDir: "./dist",
  layoutDir: "./docs",
  basePath: "/",
  dev: false,
  siteMetadata: {
    siteUrl: "https://example.com", // Required for sitemap
    siteName: "My Documentation", // Optional
    description: "Comprehensive documentation", // Optional
    themeColor: "#1e40af", // Optional (default: "#ffffff")

    // Optional icon paths (relative to outputDir)
    icon192Path: "icon-192.png",
    icon512Path: "icon-512.png",
    icon512MaskablePath: "icon-512-maskable.png",
  },
});

await build();
```

### SEO Frontmatter Fields

Add optional SEO metadata to individual pages:

```yaml
---
title: Getting Started
slug: getting-started
layout: docs
description: Learn how to get started with our framework  # Meta description
lastmod: 2025-01-15                                       # Last modified (YYYY-MM-DD)
changefreq: weekly                                        # Change frequency
priority: 0.8                                             # Priority (0.0 to 1.0)
---
```

**Available SEO fields:**

- `description` - SEO description for meta tags and sitemap
- `lastmod` - Last modified date (ISO 8601: YYYY-MM-DD)
- `changefreq` - How often the page changes: `always`, `hourly`, `daily`,
  `weekly`, `monthly`, `yearly`, `never`
- `priority` - Page priority in sitemap (0.0 to 1.0)

### Generated sitemap.xml

Example output:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/getting-started</loc>
    <lastmod>2025-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### Generated robots.txt

Example output:

```
# Allow all crawlers
User-agent: *
Allow: /

# Sitemap location
Sitemap: https://example.com/sitemap.xml
```

### Generated manifest.webmanifest

Example output:

```json
{
  "name": "My Documentation",
  "short_name": "My Docs",
  "description": "Comprehensive documentation",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1e40af",
  "background_color": "#1e40af",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Linking Production Files in HTML

Add these to your layout templates for full SEO/PWA support:

```html
<head>
  <title>{{title}}</title>

  <!-- SEO Meta Tags -->
  <meta name="description" content="Your site description">

  <!-- PWA Manifest -->
  <link rel="manifest" href="{{basePath}}/manifest.webmanifest">

  <!-- Favicons -->
  <link rel="icon" href="{{basePath}}/favicon.ico" sizes="32x32">
  <link rel="icon" href="{{basePath}}/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="{{basePath}}/apple-touch-icon.png">

  <!-- Theme Color -->
  <meta name="theme-color" content="#1e40af">
</head>
```

**Note:** The build process only generates `sitemap.xml`, `robots.txt`, and
`manifest.webmanifest`. You must provide your own icon files in `outputDir`.

## API

### markdownApp(options)

Creates a markdown app instance.

```typescript
interface MarkdownAppOptions {
  sourceDir: string; // Directory with .md files
  outputDir: string; // Directory for built HTML
  layoutDir: string; // Directory with layout templates
  basePath?: string; // Base path for URLs (default: "/")
  dev?: boolean; // Development mode (default: false)
  syntaxHighlightLanguages?: string[]; // Languages for syntax highlighting (default: ["typescript", "bash", "json", "yaml"])
  siteMetadata?: SiteMetadata; // Site metadata for production files (sitemap, robots.txt, manifest)
  assetsDir?: string; // Directory containing static assets to copy with cache busting (default: "assets")
}

interface SiteMetadata {
  siteUrl: string; // Full site URL (e.g., "https://example.com") - required for sitemap
  siteName?: string; // Site name for manifest
  description?: string; // Site description for manifest
  themeColor?: string; // Theme color (default: "#ffffff")
  faviconPath?: string; // Path to favicon.ico (relative to outputDir)
  iconSvgPath?: string; // Path to icon.svg (relative to outputDir)
  appleTouchIconPath?: string; // Path to apple-touch-icon.png (relative to outputDir)
  icon192Path?: string; // Path to 192x192 icon (relative to outputDir)
  icon512Path?: string; // Path to 512x512 icon (relative to outputDir)
  icon512MaskablePath?: string; // Path to 512x512 maskable icon (relative to outputDir)
}
```

**Syntax Highlighting:**

By default, JavaScript, HTML, and Markdown are included. Additional languages
are loaded dynamically based on `syntaxHighlightLanguages`:

```typescript
// Default languages
syntaxHighlightLanguages: ["typescript", "bash", "json", "yaml"];

// Custom languages
syntaxHighlightLanguages: ["python", "rust", "go"];

// Minimal (JS/HTML/Markdown only)
syntaxHighlightLanguages: [];
```

See [Prism language list](https://unpkg.com/browse/prismjs@1.29.0/components/)
for available languages.

**Returns:**

```typescript
interface MarkdownApp {
  register: (app: MageApp) => void; // Register middleware
  watch: () => Promise<void>; // Watch and rebuild
  build: () => Promise<void>; // Build once
}
```

### register(app)

Registers middleware to serve built files and WebSocket for hot reload.

```typescript
const app = new MageApp();
const { register } = markdownApp({ ... });

register(app);

Deno.serve(app.handler);
```

**What it does:**

- Serves static files from `outputDir` (HTML, CSS, etc.)
- Registers `/__hot-reload` WebSocket endpoint (dev mode only)

### watch()

Watch source files for changes and rebuild automatically.

```typescript
const { watch } = markdownApp({ dev: true, ... });

await watch();
// Watches sourceDir, rebuilds on .md file changes
```

**Behavior:**

- Watches `sourceDir` for `.md` file changes
- Debounces changes (100ms)
- Rebuilds all pages on change
- Notifies WebSocket clients to reload
- Logs build progress

### build()

Build all markdown files to static HTML once.

```typescript
const { build } = markdownApp({ dev: false, ... });

await build();
```

**What it builds:**

1. Loads syntax highlighting languages
2. Copies assets from `assetsDir` with cache busting (if directory exists)
3. Finds all `.md` files in `sourceDir` (recursive)
4. Parses frontmatter and renders markdown (with `{{assets}}` replacement)
5. Generates navigation from all pages
6. Applies layout template
7. Writes HTML to `outputDir`
8. Writes `gfm.css` for syntax highlighting
9. Writes production files if `siteMetadata` provided:
   - `sitemap.xml` - XML sitemap with all pages
   - `robots.txt` - Crawler directives
   - `manifest.webmanifest` - PWA manifest

## Hot Reload

In development mode (`dev: true`), changes to markdown files trigger automatic
page reload.

**How it works:**

1. Build process injects WebSocket script into HTML
2. Script connects to `/__hot-reload` endpoint
3. File watcher detects changes and rebuilds
4. Server notifies all connected clients
5. Clients reload the page

**WebSocket script location:**

- Injected before `</body>` tag if present
- Appended to end of HTML if no `</body>` tag

**Important:** Start the server before calling `watch()` to ensure the WebSocket
endpoint is available:

```typescript
register(app);
Deno.serve({ port: 3000 }, app.handler);
await watch(); // Server must be running first
```

## Styling

The Markdown App follows a **BYO-Styles** philosophy - you control all styling.

**What's provided:**

- `gfm.css` - GitHub Flavored Markdown styles (syntax highlighting, tables,
  etc.)

**What's not provided:**

- Page layout styles
- Navigation styles
- Color schemes
- Typography

See [example/docs/_layout-docs.html](./example/docs/_layout-docs.html) for an
example using Pico CSS.

## Security

### Slug Validation

Slugs are validated to prevent path traversal attacks:

```yaml
# ❌ Invalid - contains ".."
slug: ../etc/passwd

# ❌ Invalid - starts with "/"
slug: /absolute/path

# ✅ Valid
slug: api/router
slug: getting-started
slug: index
```

### Route Parameter Safety

The linear router (used by `register()`) automatically validates route
parameters to prevent path traversal. See
[Linear Router Security](../linear-router/README.md#security) for details.

## Examples

See the [example/](./example/) directory for a complete working setup:

- Markdown content files with frontmatter
- Layout template with Pico CSS
- Development and build scripts

Run the example:

```bash
# Development with hot reload
deno run --allow-all example/serve.ts

# Production build
deno run --allow-all example/build.ts
```

### Custom Base Path

When deploying to a subdirectory, set `basePath`:

```typescript
basePath: "/my-docs"; // URLs: /my-docs/getting-started, /my-docs/gfm.css
```

## Testing

```bash
# Run all markdown-app tests
deno test markdown-app/tests/ --allow-env --allow-read --allow-write

# Run specific test file
deno test markdown-app/tests/parser.test.ts --allow-env --allow-read

# Run from project root
deno test --allow-all
```

**Test coverage:**

- `tests/parser.test.ts` - Frontmatter parsing, markdown rendering, validation
- `tests/template.test.ts` - Template rendering, placeholder replacement
- `tests/navigation.test.ts` - Navigation generation, sorting, current page
  marking
- `tests/builder.test.ts` - File discovery, HTML generation, hot reload
  injection

## Architecture

### Module Breakdown

**parser.ts** - Markdown and frontmatter processing

- Extracts YAML frontmatter
- Validates required fields (title, slug, layout)
- Renders markdown to HTML with GFM
- Security: validates slugs, prevents path traversal

**template.ts** - Simple template engine

- Replaces `{{key}}` and `{{key.nested}}` patterns with values
- Supports dot notation for nested object access
- Graceful degradation (undefined → empty string)

**navigation.ts** - Auto-generated grouped navigation

- Parses `nav-item: Section/Item` format
- Groups by `nav-group` first (aside, header, footer, etc.)
- Groups by section within each group
- Sorts by nav-order (alphabetical tie-breaking)
- Marks current page with `data-current="true"`
- Returns object with group names as keys

**builder.ts** - Static HTML generation

- Finds `.md` files recursively
- Parses all files
- Generates navigation from all pages
- Applies layout templates
- Injects hot reload script (dev mode)
- Writes HTML and GFM CSS

**watcher.ts** - File watching and hot reload

- Watches sourceDir for changes
- Debounces rebuild (100ms)
- Notifies WebSocket clients
- Rebuilds on modification

**middleware.ts** - Request handling

- `serveFiles()` for static HTML/CSS
- WebSocket endpoint for hot reload

**mod.ts** - Main factory function

- Combines all modules
- Exposes `{register, watch, build}` API

## Debugging

### Common Issues

**Layout not found:**

```
Error: Layout file not found: /path/to/docs/_layout-docs.html
```

**Fix:** Ensure layout file exists and name matches frontmatter:

- Frontmatter: `layout: docs`
- File: `_layout-docs.html` (in layoutDir)

**WebSocket connection failed:**

```
[HMR] Connection error
```

**Fix:** Ensure server is started before calling `watch()`:

```typescript
register(app);
Deno.serve({ port: 3000 }, app.handler); // Start first
await watch(); // Then watch
```

**Slug validation error:**

```
Error: Invalid slug: contains ".." which could enable path traversal
```

**Fix:** Use relative paths without `..` or leading `/`:

```yaml
# ❌ Wrong
slug: ../admin

# ✅ Correct
slug: admin
```

**Navigation not showing:**

- Verify pages have `nav-item` field in frontmatter
- Check `nav-group` matches the group used in your layout template (e.g.,
  `{{navigation.aside}}`)
- Check `nav-order` values
- Inspect generated HTML (navigation groups may be empty if no pages have
  matching nav-group)

**Hot reload not working:**

- Check browser console for WebSocket errors
- Verify `dev: true` in options
- Ensure server is running before calling `watch()`

## Performance

**Build performance:**

- 100 markdown files: ~500ms
- 500 markdown files: ~2s
- Parallel file reading (Deno.readTextFile is async)

**Development experience:**

- Hot reload: ~100ms (debounced rebuild + WebSocket notification)
- File watching: Native OS file system events

**Production:**

- Static HTML files (serve with CDN)
- No runtime overhead (pre-rendered)
- GFM CSS included (no external dependencies)

## License

Part of the Mage framework.
