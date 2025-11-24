---
title: "Layouts"
description: "Creating Preact layouts for Pages"
---

# Layouts

Layouts are [Preact](https://preactjs.com) components that wrap your Markdown
content. They receive rendered HTML and frontmatter, handle page structure, and
support client-side interactivity through hydration.

## Basic Layout

**`layouts/default.tsx`**:

```tsx
import { Head, type LayoutProps } from "@mage/app/pages";

export default function DefaultLayout({
  html,
  title,
  description,
}: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
      </Head>

      <nav>
        <a href="/">Home</a>
        <a href="/guide">Guide</a>
      </nav>

      <main>
        <article
          data-mage-content="true"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
    </>
  );
}
```

**Key points:**

- Export a default function
- Receive `LayoutProps`
- Use `<Head>` for document head content
- Mark content with `data-mage-content="true"` for hydration
- Return body content only (no `<html>` or `<body>` tags)

## LayoutProps

Every layout receives these props:

```typescript
interface LayoutProps {
  html: string; // Rendered Markdown HTML
  title: string; // From frontmatter
  description?: string; // From frontmatter (optional)
  additionalFrontmatter?: Record<string, unknown>; // Custom fields
}
```

### Accessing Custom Fields

```markdown
---
title: "Blog Post"
layout: "blog"
author: "Jane Doe"
date: "2024-01-15"
tags: ["preact", "typescript"]
---
```

Note: `title`, `description`, and `layout` are extracted as top-level props. All
other fields go into `additionalFrontmatter`.

```tsx
export default function BlogLayout({
  html,
  title,
  additionalFrontmatter,
}: LayoutProps) {
  const author = additionalFrontmatter?.author as string;
  const date = additionalFrontmatter?.date as string;
  const tags = additionalFrontmatter?.tags as string[];

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <header>
        <h1>{title}</h1>
        <p>
          By {author} on {date}
        </p>
        <div>Tags: {tags?.join(", ")}</div>
      </header>

      <article
        data-mage-content="true"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
```

## Head Component

Use the `<Head>` component to add content to the document `<head>`:

```tsx
import { Head, type LayoutProps } from "@mage/app/pages";

export default function Layout({ html, title, description }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <link rel="stylesheet" href="/public/styles.css" />
        <script src="/public/analytics.js" />
      </Head>

      <article dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
```

Multiple `<Head>` components merge their children.

## Interactive Components

Add Preact components with hooks for interactivity:

```tsx
import { Head, type LayoutProps } from "@mage/app/pages";
import { useState } from "preact/hooks";

function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Theme: {theme}
    </button>
  );
}

export default function InteractiveLayout({ html, title }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <header>
        <ThemeToggle />
      </header>

      <article
        data-mage-content="true"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
```

**How it works:**

1. Server renders static HTML
2. Client bundle hydrates components
3. Interactive features activate

## Hydration

Pages uses server-side rendering (SSR) with client-side hydration:

**Development:**

- No client bundles generated
- Only hot reload script included
- Components render server-side only

**Production:**

- One bundle per page with cache-busting
- Bundles hydrate interactive components
- Content marked with `data-mage-content="true"` extracted for hydration
- SSR'd HTML always visible, even if hydration fails

### Error Boundaries

Wrap interactive components with `ErrorBoundary` for graceful degradation:

```tsx
import { ErrorBoundary, Head, type LayoutProps } from "@mage/app/pages";

function ComplexWidget() {
  // Interactive component that might fail
  return <div>Widget content</div>;
}

export default function Layout({ html, title }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <ErrorBoundary
        fallback={
          <div class="error">
            Interactive features unavailable. Content is still readable.
          </div>
        }
      >
        <ComplexWidget />
      </ErrorBoundary>

      <article
        data-mage-content="true"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
```

If hydration or component rendering fails, fallback UI displays instead of
crashing the page.

## Multiple Layouts

Create different layouts for different page types:

**`layouts/article.tsx`**:

```tsx
export default function ArticleLayout({ html, title }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <article
        class="prose"
        data-mage-content="true"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
```

**`layouts/landing.tsx`**:

```tsx
export default function LandingLayout({ html }: LayoutProps) {
  return (
    <>
      <Head>
        <title>Welcome</title>
      </Head>

      <div
        class="hero"
        data-mage-content="true"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
```

Specify which layout to use in frontmatter:

**For `layouts/article.tsx`:**

```markdown
---
title: "Article Title"
layout: "article"
---
```

**For `layouts/landing.tsx`:**

```markdown
---
title: "Welcome"
layout: "landing"
---
```

**Default layout (when omitted):**

```markdown
---
title: "Article Title"
---
```

Pages without a `layout` field default to `layouts/default.tsx`

## Navigation

Navigation is manually defined (no auto-generation):

```tsx
const navItems = [
  { label: "Home", href: "/" },
  { label: "Docs", href: "/docs" },
  { label: "Guide", href: "/guide" },
];

export default function Layout({ html, title }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <nav>
        {navItems.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>

      <article
        data-mage-content="true"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
```

## Notes

- Layouts must export a default function
- Layouts should never include `<html>` or `<body>` tags (use `_html.tsx`)
- Use `data-mage-content="true"` on content containers for hydration
- `<Head>` content is extracted and placed in document `<head>`
- Missing layouts cause build errors with clear messages
- Interactive components work in production builds (with hydration)
- ErrorBoundary prevents hydration failures from crashing pages

## Related

- [Markdown](/pages/markdown) - Writing content with frontmatter
- [HTML Template](/pages/html-template) - Customizing document structure
- [Styles](/pages/styles) - Using UnoCSS in layouts
- [Getting Started](/pages/getting-started) - Setting up your first site
