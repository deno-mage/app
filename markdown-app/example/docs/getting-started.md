---
title: Getting Started
slug: getting-started
layout: docs
nav: Guide/Getting Started
nav-order: 1
---

# Getting Started

Learn how to use Mage Markdown App in your project.

## Installation

Mage Markdown App is built into the Mage framework. No additional installation
needed!

## Project Structure

Create your documentation with this structure:

```
docs/
├── index.md
├── getting-started.md
├── _layout-docs.html
└── _site/  (generated)
```

## Frontmatter Fields

Every markdown file needs frontmatter:

| Field       | Required | Description              |
| ----------- | -------- | ------------------------ |
| `title`     | Yes      | Page title               |
| `slug`      | Yes      | URL path                 |
| `layout`    | Yes      | Layout template name     |
| `nav`       | No       | Navigation section/item  |
| `nav-order` | No       | Sort order in navigation |

## Example Frontmatter

```yaml
---
title: Getting Started
slug: getting-started
layout: docs
nav: Guide/Getting Started
nav-order: 1
---
```

## Development Mode

Run with hot reload:

```typescript
const { register, watch } = markdownApp({
  sourceDir: "./docs",
  outputDir: "./docs/_site",
  layoutDir: "./docs",
  basePath: "/",
  dev: true, // Enable hot reload
});

register(app);
await watch();
```

## Build Mode

Generate static HTML:

```typescript
const { build } = markdownApp({
  sourceDir: "./docs",
  outputDir: "./docs/_site",
  layoutDir: "./docs",
  basePath: "/",
  dev: false,
});

await build();
```

That's it! You're ready to start writing docs.
