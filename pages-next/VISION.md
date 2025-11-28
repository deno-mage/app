# Mage Pages Vision

## What

A static site generator with:

- **Nested layouts** - `_layout.tsx` files compose automatically by directory
- **Interactive TSX pages** - Full Preact hydration, not just static HTML
- **Markdown support** - With frontmatter and syntax highlighting
- **Convention over configuration** - File structure determines routing

## Why

The current `/pages` module passes HTML strings to layouts. This limits
composability and prevents interactive components. We want proper component
composition where layouts receive `children`, not strings.

## Key Principles

1. **All system files optional** - Sensible defaults for `_layout.tsx`,
   `_html.tsx`, `_not-found.tsx`, `_error.tsx`
2. **No double HTML shipping** - Markdown content extracted from DOM on hydrate
3. **Component composition** - Layouts wrap children, not HTML strings
4. **Optional UnoCSS** - Add `uno.config.ts` to enable utility CSS generation

## Modes

- **Development** - Dev server with hot reload, on-demand rendering
- **Production build** - Pre-render all pages to static HTML + JS bundles
- **Production serve** - Ser

## Page Types

Pages can be either **Markdown** (`.md`) or **Preact components** (`.tsx`).

Both require frontmatter with at least a `title`. Markdown uses YAML
frontmatter, TSX uses an exported object.

### Markdown Page

```md
---
title: Getting Started
description: Learn how to use Mage
---

# Getting Started

This is **markdown** content with syntax highlighting:

\`\`\`typescript const app = new MageApp(); \`\`\`
```

### TSX Page (same content)

```tsx
import { useFrontmatter } from "@mage/app/pages";

export const frontmatter = {
  title: "Getting Started",
  description: "Learn how to use Mage",
};

export default function GettingStarted() {
  const { title } = useFrontmatter();

  return (
    <article>
      <h1>{title}</h1>
      <p>
        This is a <strong>Preact component</strong> with interactivity.
      </p>
      <button onClick={() => alert("Interactive!")}>Click me</button>
    </article>
  );
}
```

## Example Structure

```
pages/
  _layout.tsx      <- Root layout (optional)
  _html.tsx        <- Document template (optional)
  index.md         <- Home page
  docs/
    _layout.tsx    <- Docs layout (optional)
    getting-started.md
    api/
      request.tsx  <- Interactive page
```
