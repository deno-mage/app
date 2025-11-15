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
nav: Guide/Getting Started # Navigation section/item
nav-order: 1               # Sort order (lower = first)
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
nav: Middleware/CORS
nav-order: 1
---
```

See [example/docs/](./example/docs/) for more examples.

## Layouts

Layout files are HTML templates with `{{key}}` placeholders.

### Available Template Variables

- `{{title}}` - Page title from frontmatter
- `{{content}}` - Rendered markdown HTML
- `{{navigation}}` - Auto-generated navigation
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
    <nav>{{navigation}}</nav>
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

Navigation is automatically generated from pages with `nav` frontmatter field.

### Nav Field Format

```yaml
nav: Introduction # Unsectioned item
nav: Guide/Getting Started # Sectioned item (Section/Item)
```

Generates semantic HTML with `<section>`, `<h3>`, and `<ul>` elements.

### Navigation Sorting

Items sorted by `nav-order` (ascending), alphabetically for ties:

```yaml
nav-order: 1 # First
nav-order: 2 # Second
# (no order)  # Defaults to 999 (last)
```

### Current Page

The current page link includes `data-current="true"` for styling:

```css
nav a[data-current="true"] {
  font-weight: bold;
}
```

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

1. Finds all `.md` files in `sourceDir` (recursive)
2. Parses frontmatter and renders markdown
3. Generates navigation from all pages
4. Applies layout template
5. Writes HTML to `outputDir`
6. Writes `gfm.css` for syntax highlighting

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

- Replaces `{{key}}` patterns with values
- Graceful degradation (undefined → empty string)

**navigation.ts** - Auto-generated navigation

- Parses `nav: Section/Item` format
- Groups by section
- Sorts by nav-order (alphabetical tie-breaking)
- Marks current page with `data-current="true"`

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

- Verify pages have `nav` field in frontmatter
- Check `nav-order` values
- Inspect generated HTML (navigation may be empty if no pages have nav)

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
