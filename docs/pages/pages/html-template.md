---
title: "HTML Template"
description: "Customizing document structure with _html.tsx"
---

# HTML Template

Customize the HTML document structure with `_html.tsx`. This optional file
defines the `<html>`, `<head>`, and `<body>` wrapper for all pages.

## Basic Usage

**`_html.tsx`**:

```tsx
import type { HtmlTemplateProps } from "@mage/app/pages";

export default function Html(props: HtmlTemplateProps): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body></body>
    </html>
  );
}
```

**Key points:**

- Place at project root (e.g., `docs/_html.tsx`)
- Export default function accepting `HtmlTemplateProps`
- Return complete `<html>` document structure
- Leave `<body>` empty - Pages injects layouts and content
- Optional - Pages uses default template if not provided

## HtmlTemplateProps

```typescript
interface HtmlTemplateProps {
  layoutProps: LayoutProps; // Access page metadata
}

interface LayoutProps {
  title: string;
  description?: string;
  additionalFrontmatter?: Record<string, unknown>;
}
```

Access page metadata for conditional logic:

```tsx
export default function Html({ layoutProps }: HtmlTemplateProps): JSX.Element {
  const { title, description } = layoutProps;

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>My Site | {title}</title>
        {description && <meta name="description" content={description} />}
      </head>
      <body></body>
    </html>
  );
}
```

## Common Patterns

### Global Styles

```tsx
export default function Html(props: HtmlTemplateProps): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/public/styles.css" />
        <link rel="stylesheet" href="/public/fonts.css" />
      </head>
      <body></body>
    </html>
  );
}
```

### Theme Initialization

Prevent flash of unstyled content with inline script:

```tsx
export default function Html(props: HtmlTemplateProps): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('theme');
                const system = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const theme = stored || system;
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-white dark:bg-gray-900"></body>
    </html>
  );
}
```

### Analytics

```tsx
export default function Html(props: HtmlTemplateProps): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script async src="https://analytics.example.com/script.js" />
      </head>
      <body></body>
    </html>
  );
}
```

### Custom Body Attributes

```tsx
export default function Html(props: HtmlTemplateProps): JSX.Element {
  return (
    <html lang="en" style="scroll-padding-top: 110px;">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
        className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
        data-theme="light"
      >
      </body>
    </html>
  );
}
```

### Favicons

```tsx
export default function Html(props: HtmlTemplateProps): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/public/favicon.ico" />
        <link rel="apple-touch-icon" href="/public/apple-touch-icon.png" />
        <link rel="manifest" href="/public/manifest.json" />
      </head>
      <body></body>
    </html>
  );
}
```

### Open Graph Meta Tags

```tsx
export default function Html({ layoutProps }: HtmlTemplateProps): JSX.Element {
  const { title, description } = layoutProps;

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content={title} />
        {description && (
          <meta
            property="og:description"
            content={description}
          />
        )}
        <meta property="og:type" content="website" />
      </head>
      <body></body>
    </html>
  );
}
```

## Automatic Injection

Pages automatically injects into the template:

**In `<head>`:**

- Content from layout `<Head>` components
- UnoCSS stylesheet (if configured)
- Hot reload script (dev only)

**In `<body>`:**

- Rendered layout and page content
- Hydration data script
- Client bundle script (production only)

**Example rendering:**

Your template:

```tsx
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="/public/styles.css" />
  </head>
  <body></body>
</html>;
```

Pages outputs:

```html
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="/public/styles.css" />
    <!-- Injected by Pages -->
    <title>Page Title</title>
    <link rel="stylesheet" href="/__styles/uno-abc123.css" />
  </head>
  <body>
    <!-- Injected by Pages -->
    <nav>...</nav>
    <main>...</main>
    <script>
      window.__PAGE_PROPS__ = { title: "..." };
    </script>
    <script type="module" src="/__bundles/page-abc123.js"></script>
  </body>
</html>
```

## Notes

- Optional file - Pages provides default template if not present
- Must be named `_html.tsx` (underscore prefix)
- Must export default function
- Leave `<body>` empty - Pages injects content
- Do not include `<Head>` components (use in layouts instead)
- Access page metadata via `props.layoutProps`
- Scripts in `<head>` execute before page content
- Inline scripts useful for preventing FOUC (flash of unstyled content)

## Related

- [Layouts](/pages/layouts) - Using `<Head>` component in layouts
- [Assets](/pages/assets) - Referencing global stylesheets and scripts
- [Styles](/pages/styles) - UnoCSS configuration
- [Getting Started](/pages/getting-started) - Project structure
