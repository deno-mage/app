---
title: "Markdown"
description: "Writing Markdown pages with frontmatter"
---

# Markdown

Write content in Markdown with YAML frontmatter for metadata. Pages converts
Markdown to HTML and passes it to your layouts.

## Frontmatter

Frontmatter is YAML metadata at the top of your Markdown file, wrapped in `---`:

```markdown
---
title: "Getting Started"
description: "Learn the basics"
---

# Getting Started

Your content here.
```

### Required Fields

| Field   | Type     | Description                  |
| ------- | -------- | ---------------------------- |
| `title` | `string` | Page title for `<title>` tag |

### Optional Fields

| Field         | Type     | Default     | Description                                    |
| ------------- | -------- | ----------- | ---------------------------------------------- |
| `description` | `string` | -           | Meta description for `<meta>` tag              |
| `layout`      | `string` | `"default"` | Layout name (resolves to `layouts/{name}.tsx`) |

### Custom Fields

Add any custom fields for your layouts:

```markdown
---
title: "API Reference"
description: "API documentation"
layout: "api"
author: "Jane Doe"
version: "1.0"
tags: ["api", "reference"]
---

# API Reference

Content here.
```

Access in layout via `additionalFrontmatter`:

```tsx
export default function ApiLayout({
  html,
  title,
  additionalFrontmatter,
}: LayoutProps) {
  const author = additionalFrontmatter?.author as string;
  const tags = additionalFrontmatter?.tags as string[];

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div>Author: {author}</div>
      <div>Tags: {tags?.join(", ")}</div>
      <article dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
```

## Markdown Syntax

Pages uses [GitHub-flavored Markdown](https://github.github.com/gfm/).

### Headings

```markdown
# H1

## H2

### H3
```

### Text Formatting

```markdown
**Bold text** _Italic text_ ~~Strikethrough~~ `Inline code`
```

### Links

```markdown
[Link text](https://example.com) [Internal link](/guide)
[Link with title](https://example.com "Hover title")
```

### Images

```markdown
![Alt text](/public/image.png) ![Logo](/public/logo.png "Logo title")
```

### Code Blocks

````markdown
```typescript
const app = new MageApp();
app.get("/", (c) => c.text("Hello"));
```
````

### Lists

```markdown
- Unordered item 1
- Unordered item 2
  - Nested item

1. Ordered item 1
2. Ordered item 2
```

### Blockquotes

```markdown
> This is a blockquote. It can span multiple lines.
```

### Horizontal Rules

```markdown
---
```

### Tables

```markdown
| Column 1 | Column 2 |
| -------- | -------- |
| Value 1  | Value 2  |
| Value 3  | Value 4  |
```

### HTML in Markdown

You can use raw HTML:

```markdown
<div class="custom-class">
  <p>Custom HTML content</p>
</div>

<details>
  <summary>Click to expand</summary>
  Hidden content here.
</details>
```

## Layout Resolution

Frontmatter `layout` field determines which layout wraps the content:

1. `layout: "article"` → `layouts/article.tsx`
2. `layout: "docs"` → `layouts/docs.tsx`
3. No `layout` field → `layouts/default.tsx`

If the specified layout doesn't exist, build fails with clear error message.

## File Organization

Organize Markdown files in subdirectories:

```
pages/
├── index.md              # /
├── about.md              # /about
├── _not-found.md         # Custom 404 page (optional)
├── _error.md             # Custom 500 page (optional)
├── docs/
│   ├── index.md          # /docs
│   ├── getting-started.md  # /docs/getting-started
│   └── api/
│       └── reference.md  # /docs/api/reference
```

Files prefixed with underscore (`_not-found.md`, `_error.md`) create custom
error pages. See [Error Pages](/pages/error-pages) for details.

## Notes

- Frontmatter must be valid YAML
- Markdown is converted to HTML with [marked](https://marked.js.org/)
- Code blocks support syntax highlighting (via CSS)
- All standard GitHub-flavored Markdown features supported
- Invalid frontmatter causes build error with line number

## Related

- [Layouts](/pages/layouts) - Wrapping content in Preact components
- [Assets](/pages/assets) - Referencing images and files
- [Getting Started](/pages/getting-started) - Setting up your first site
