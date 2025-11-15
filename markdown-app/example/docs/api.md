---
title: API Reference
slug: api
layout: docs
nav: Reference/API
nav-order: 1
---

# API Reference

Complete API documentation for Mage Markdown App.

## `markdownApp(options)`

Create a markdown app instance.

**Options:**

```typescript
interface MarkdownAppOptions {
  sourceDir: string; // Where .md files live
  outputDir: string; // Where HTML is built
  layoutDir: string; // Where _layout-*.html lives
  basePath?: string; // URL prefix (default: "/")
  dev?: boolean; // Hot reload mode (default: false)
}
```

**Returns:**

```typescript
interface MarkdownApp {
  register: (app: MageApp) => void;
  watch: () => Promise<void>;
  build: () => Promise<void>;
}
```

## `register(app)`

Register middleware with a MageApp instance.

Sets up:

- `serveFiles` for outputDir at basePath
- WebSocket endpoint at `/__hot-reload` (dev mode only)

**Example:**

```typescript
const app = new MageApp();
const { register } = markdownApp({ ... });

register(app);
```

## `watch()`

Watch sourceDir for changes and rebuild on file modification.

Notifies connected WebSocket clients to reload.

**Example:**

```typescript
const { watch } = markdownApp({ ... });
await watch();
```

## `build()`

Build all markdown files to static HTML once.

Useful for CI/deployment builds.

**Example:**

```typescript
const { build } = markdownApp({ ... });
await build();
```

## Template Variables

Available in layout templates:

| Variable         | Description                 |
| ---------------- | --------------------------- |
| `{{title}}`      | Page title from frontmatter |
| `{{content}}`    | Rendered markdown HTML      |
| `{{navigation}}` | Auto-generated navigation   |
| `{{basePath}}`   | URL prefix from config      |

## Navigation Structure

Auto-generated from frontmatter:

```yaml
nav: Section/Item # Creates section with item
nav: Item # Item without section
nav-order: 1 # Numeric sort (alphabetical tie-break)
```

The current page is marked with `data-current="true"` in the navigation HTML.
