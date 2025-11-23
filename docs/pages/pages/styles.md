---
title: "Styles"
description: "Using UnoCSS for zero-config utility CSS"
---

# Styles

Pages includes zero-config [UnoCSS](https://unocss.dev) support for
utility-first CSS. Write [Tailwind](https://tailwindcss.com)-compatible classes,
and Pages generates optimized CSS automatically.

## Setup

Install UnoCSS dependencies:

```bash
deno add npm:@unocss/core npm:@unocss/preset-wind4
```

Create `uno.config.ts` in your project root:

```typescript
import presetWind4 from "@unocss/preset-wind4";

export default {
  presets: [presetWind4()],
};
```

That's it. UnoCSS is now enabled.

## Usage

Use utility classes in Markdown and layouts:

**In Markdown:**

```markdown
<div class="container mx-auto px-4">
  <h1 class="text-4xl font-bold text-blue-600">Welcome</h1>
  <p class="text-lg text-gray-700">Your content here.</p>
</div>
```

**In layouts:**

```tsx
export default function Layout({ html, title }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <nav class="bg-gray-800 text-white p-4">
        <a href="/" class="hover:text-blue-400">
          Home
        </a>
      </nav>

      <main class="container mx-auto">
        <article
          data-mage-content="true"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
    </>
  );
}
```

## How It Works

**Development:**

- Scans all source files (`.ts`, `.tsx`, `.md`, `.html`)
- Generates CSS with only the utilities you use
- Serves from `/__styles/uno-{hash}.css`
- Automatically injected into `<head>`
- Regenerates on file changes

**Production:**

- Single site-wide CSS bundle for all pages
- Content-hashed filename for cache-busting
- Typically 5-20KB for small-medium sites
- Includes CSS reset and utilities

**Files scanned:**

- ✅ All `.ts`, `.tsx`, `.js`, `.jsx` files
- ✅ All `.md`, `.mdx`, `.html` files
- ✅ Root-level files (`_html.tsx`)
- ✅ Nested directories (`pages/`, `layouts/`, `components/`)
- ❌ `dist/` and `node_modules/` excluded

## Configuration

Customize via `uno.config.ts`:

```typescript
import presetWind4 from "@unocss/preset-wind4";

export default {
  presets: [presetWind4()],

  // Custom theme
  theme: {
    colors: {
      brand: "#3b82f6",
      accent: "#10b981",
    },
    fontFamily: {
      sans: ["Inter", "sans-serif"],
    },
  },

  // Custom shortcuts
  shortcuts: {
    btn: "px-4 py-2 rounded bg-brand text-white hover:bg-blue-600",
    card: "p-6 rounded-lg shadow-md bg-white",
  },

  // Custom rules
  rules: [["custom-rule", { color: "red" }]],
};
```

### Theme Customization

```typescript
export default {
  presets: [presetWind4()],
  theme: {
    colors: {
      primary: {
        50: "#eff6ff",
        100: "#dbeafe",
        500: "#3b82f6",
        900: "#1e3a8a",
      },
    },
    spacing: {
      128: "32rem",
      144: "36rem",
    },
  },
};
```

Use in classes:

```tsx
<div class="text-primary-500 p-128">Content</div>;
```

### Shortcuts

Create reusable class combinations:

```typescript
export default {
  presets: [presetWind4()],
  shortcuts: {
    btn: "px-4 py-2 rounded font-semibold",
    "btn-primary": "btn bg-blue-600 text-white hover:bg-blue-700",
    "btn-secondary": "btn bg-gray-200 text-gray-800 hover:bg-gray-300",
  },
};
```

```tsx
<button class="btn-primary">Save</button>
<button class="btn-secondary">Cancel</button>
```

## Alternative Styling

UnoCSS is opt-in. Use regular CSS if preferred:

**`public/styles.css`**:

```css
body {
  font-family: sans-serif;
  margin: 0;
  padding: 0;
}

nav {
  background: #1f2937;
  color: white;
  padding: 1rem;
}
```

**In layout:**

```tsx
export default function Layout({ html, title }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="stylesheet" href="/public/styles.css" />
      </Head>

      <nav>
        <a href="/">Home</a>
      </nav>

      <article dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
```

## Common Patterns

### Typography

```markdown
<div class="prose prose-lg max-w-none">
  <h1 class="text-4xl font-bold mb-4">Heading</h1>
  <p class="text-gray-700 leading-relaxed">
    Paragraph text with comfortable line height.
  </p>
</div>
```

### Layout

```tsx
<div class="min-h-screen flex flex-col">
  <header class="bg-white shadow">Header</header>
  <main class="flex-1 container mx-auto px-4 py-8">Content</main>
  <footer class="bg-gray-900 text-white p-4">Footer</footer>
</div>;
```

### Responsive

```tsx
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div class="p-4 bg-white rounded shadow">Card 1</div>
  <div class="p-4 bg-white rounded shadow">Card 2</div>
  <div class="p-4 bg-white rounded shadow">Card 3</div>
</div>;
```

### Dark Mode

```typescript
// uno.config.ts
export default {
  presets: [presetWind4()],
  darkMode: "class", // or 'media'
};
```

```tsx
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>;
```

## Notes

- UnoCSS is **opt-in** - only enabled when `uno.config.ts` exists
- CSS generation happens once per build (not per page)
- If config loading fails, build continues without UnoCSS (logs error)
- Compatible with Tailwind CSS syntax via `@unocss/preset-wind4`
- See [UnoCSS documentation](https://unocss.dev) for full configuration

## Related

- [Layouts](/pages/layouts) - Creating Preact layouts
- [Assets](/pages/assets) - Managing static files
- [HTML Template](/pages/html-template) - Document structure customization
