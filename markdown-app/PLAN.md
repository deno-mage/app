# Markdown App - Implementation Plan

**Goal:** Build markdown-driven documentation support for Mage that dogfoods the
framework.

## Design Principles

- **No frills, SIMPLE** - Minimal API surface, clear purpose
- **Opinionated** - Convention over configuration where it matters
- **Production-ready** - Static build output, deployable anywhere
- **Great DX** - Hot reload, markdown-driven, semantic HTML

---

## API Design

### Usage

```typescript
import { markdownApp } from "@mage/app/markdown-app";

const { register, watch, build } = markdownApp({
  sourceDir: "./docs", // Where .md files live
  outputDir: "./docs/_site", // Where HTML is built
  layoutDir: "./docs", // Where _layout-{name}.html lives
  basePath: "/docs", // URL prefix (default: "/")
  dev: true, // Hot reload mode (default: false)
});

// Development
register(app); // Adds serveFiles + /__hot-reload WebSocket
await watch(); // Watches sourceDir, rebuilds on change

// Build (CI/deployment)
await build(); // One-time build to outputDir
```

### Functions

| Function        | Purpose       | Details                                                                |
| --------------- | ------------- | ---------------------------------------------------------------------- |
| `register(app)` | Setup serving | Adds `serveFiles()` for outputDir + `/__hot-reload` WebSocket endpoint |
| `watch()`       | Dev mode      | Watches sourceDir, rebuilds on change, notifies clients via WebSocket  |
| `build()`       | Build mode    | One-time build of all markdown → HTML, writes to outputDir             |

---

## Frontmatter Schema

```yaml
---
title: CORS Middleware           # Required: Page title
slug: middleware/cors            # Required: URL path (relative to basePath)
nav: Middleware/CORS             # Optional: Navigation section/item
nav-order: 1                     # Optional: Sort order (alphabetical tie-break)
layout: docs                     # Required: Layout template name
---
```

### Field Rules

- `title` - Required, used in `<title>` and `{{title}}`
- `slug` - Required, determines output path and URL
- `nav` - Optional, format: `Section/Item` or just `Item`
- `nav-order` - Optional, numeric sort (duplicates sorted alphabetically by
  title)
- `layout` - Required, looks for `_layout-{name}.html` in layoutDir

---

## File Structure

### Source

```
docs/
├── index.md                    # slug: /
├── getting-started.md          # slug: getting-started
├── api/
│   ├── router.md              # slug: api/router
│   └── context.md             # slug: api/context
├── _layout-index.html         # Layout for index pages
├── _layout-docs.html          # Layout for docs pages
```

### Output

```
docs/_site/
├── index.html                 # /docs/
├── getting-started.html       # /docs/getting-started
├── api/
│   ├── router.html           # /docs/api/router
│   └── context.html          # /docs/api/context
├── gfm.css                   # GitHub Flavored Markdown styles
```

**Preserves directory structure based on slug.**

---

## Template System

### Simple `{{key}}` Replacement

```html
<!DOCTYPE html>
<html>
  <head>
    <title>{{title}}</title>
    <link rel="stylesheet" href="{{basePath}}/gfm.css">
  </head>
  <body>
    <aside>
      {{navigation}}
    </aside>
    <main>
      {{content}}
    </main>
  </body>
</html>
```

### Available Variables

| Variable         | Description                 | Example                             |
| ---------------- | --------------------------- | ----------------------------------- |
| `{{title}}`      | Page title from frontmatter | `CORS Middleware`                   |
| `{{content}}`    | Rendered markdown HTML      | `<h1>CORS</h1><p>...</p>`           |
| `{{navigation}}` | Auto-generated nav HTML     | `<nav><section>...</section></nav>` |
| `{{basePath}}`   | URL prefix from config      | `/docs`                             |

---

## Navigation Generation

Auto-generated from frontmatter `nav` field:

```html
<nav>
  <section>
    <h3>Getting Started</h3>
    <ul>
      <li><a href="/docs/introduction">Introduction</a></li>
      <li><a href="/docs/installation">Installation</a></li>
    </ul>
  </section>
  <section>
    <h3>Middleware</h3>
    <ul>
      <li><a href="/docs/middleware/cors" data-current="true">CORS</a></li>
      <li><a href="/docs/middleware/compression">Compression</a></li>
    </ul>
  </section>
</nav>
```

**Features:**

- Sections from `nav: Section/Item`
- Current page marked with `data-current="true"`
- Sorted by `nav-order` (alphabetical tie-break)
- Section order determined by first item's order
- Semantic HTML (no classes, easy to style)

---

## Hot Reload (Dev Mode)

### Server-Side

1. Watch `sourceDir` for `.md` file changes
2. Rebuild changed file → HTML
3. Notify all connected WebSocket clients
4. Client reloads page

### Client-Side Script

Injected before `</body>` in dev mode:

```html
<script>
  const ws = new WebSocket("ws://localhost:3000/__hot-reload");
  ws.onmessage = () => location.reload();
  ws.onclose = () => {
    console.log("[HMR] Disconnected, retrying...");
    setTimeout(() => location.reload(), 1000);
  };
</script>
```

**Host detection:** Replace `localhost:3000` with actual server host/port.

---

## Dependencies

| Package     | Purpose                              | Import          |
| ----------- | ------------------------------------ | --------------- |
| `@deno/gfm` | Markdown → HTML, syntax highlighting | `jsr:@deno/gfm` |
| `@std/yaml` | Frontmatter parsing                  | `jsr:@std/yaml` |
| `@std/path` | Path resolution                      | `jsr:@std/path` |
| `@std/fs`   | File operations                      | `jsr:@std/fs`   |

**Note:** @deno/gfm includes Prism.js syntax highlighting by default.

---

## Implementation Modules

```
markdown-app/
├── mod.ts                 # Main exports: markdownApp()
├── middleware.ts          # register() implementation
├── builder.ts             # build() implementation
├── watcher.ts             # watch() implementation
├── parser.ts              # Frontmatter + markdown parsing
├── template.ts            # {{}} template engine
├── navigation.ts          # Navigation generation from frontmatter
└── README.md              # User documentation
```

### Module Responsibilities

| Module          | Exports                          | Purpose                              |
| --------------- | -------------------------------- | ------------------------------------ |
| `mod.ts`        | `markdownApp(options)`           | Main factory function                |
| `middleware.ts` | `register(app, options)`         | Setup serveFiles + WebSocket         |
| `builder.ts`    | `build(options)`                 | Build all markdown → HTML            |
| `watcher.ts`    | `watch(options, rebuild)`        | File watcher + WebSocket notify      |
| `parser.ts`     | `parseMarkdown(content)`         | Extract frontmatter, render markdown |
| `template.ts`   | `renderTemplate(template, data)` | {{}} replacement                     |
| `navigation.ts` | `generateNavigation(pages)`      | Build nav HTML from frontmatter      |

---

## Build Process

1. **Scan** - Find all `.md` files in `sourceDir`
2. **Parse** - Extract frontmatter + render markdown via @deno/gfm
3. **Validate** - Check required fields (title, slug, layout)
4. **Generate Nav** - Build navigation HTML from all pages
5. **Render** - Apply layout template with variables
6. **Write** - Output HTML to `outputDir` based on slug
7. **Copy GFM CSS** - Write @deno/gfm CSS to `gfm.css`

---

## Error Handling

### Fail Fast

- Missing required frontmatter fields → throw error with file path
- Invalid YAML frontmatter → throw error with parse details
- Layout file not found → throw error with expected path
- Markdown file not readable → throw error with path

### Resilient

- Duplicate `nav-order` → alphabetical tie-break
- Missing `nav` field → page not in navigation
- Invalid slug characters → sanitize/warn

---

## MVP Scope

### In Scope ✅

- Frontmatter parsing (YAML)
- Markdown → HTML (@deno/gfm with Prism)
- Multiple layouts
- Navigation generation
- Hot reload (WebSocket)
- Static build output
- GFM CSS export

### Out of Scope (Future) 🔄

- Search index generation
- Table of contents auto-generation
- Image optimization
- Link validation
- Advanced template helpers
- Shiki integration (use @deno/gfm Prism for now)

---

## Testing Strategy

1. **Unit tests** for each module
   - `parser.ts` - frontmatter extraction, markdown rendering
   - `template.ts` - variable replacement
   - `navigation.ts` - nav generation logic

2. **Integration tests**
   - Full build process
   - Hot reload WebSocket
   - serveFiles integration

3. **Dogfooding**
   - Build Mage's own docs using markdown-app
   - Validate real-world usage

---

## Success Criteria

- ✅ Can build Mage docs from markdown files
- ✅ Hot reload works in development
- ✅ Static output deployable to CDN
- ✅ Navigation auto-generates correctly
- ✅ Multiple layouts supported
- ✅ Clean, semantic HTML output
- ✅ Simple API (3 functions, 5 config options)
