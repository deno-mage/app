---
title: "Error Pages"
description: "Custom 404 and 500 error pages with layouts"
---

# Error Pages

Create custom pages for 404 (not found) and 500 (server error) responses using
special underscore-prefixed files in the `pages/` directory.

## Quick Start

**`pages/_not-found.md`** - Custom 404 page:

```markdown
---
title: "Page Not Found"
description: "The page you're looking for doesn't exist"
layout: "default"
---

# 404 - Page Not Found

Sorry, we couldn't find that page.

[Return home](/)
```

**`pages/_error.md`** - Custom 500 page:

```markdown
---
title: "Error"
description: "An error occurred"
layout: "default"
---

# Something went wrong

An error occurred while rendering this page.

[Return home](/)
```

## How It Works

**Development mode:**

- `_not-found.md` renders when a route doesn't exist
- `_error.md` renders when page rendering fails
- Served with appropriate status codes (404 or 500)
- Falls back to simple error pages if files don't exist

**Production builds:**

- `_not-found.md` renders to `dist/404.html`
- `_error.md` renders to `dist/500.html`
- Static files can be served by CDN/hosting for error responses
- Falls back to simple error pages if files don't exist

## Customization

Error pages are regular Markdown files with full frontmatter support:

```markdown
---
title: "Oops!"
layout: "minimal"
author: "Support Team"
contact: "support@example.com"
---

# Page Not Found

Can't find what you're looking for?

- [Visit our help center](/help)
- [Search our docs](/search)
- [Contact support](mailto:support@example.com)
```

Use any layout, include images, add navigation, or embed components.

## Examples

### Styled 404 with Links

```markdown
---
title: "404 - Not Found"
layout: "default"
---

<div class="text-center py-16">
  <h1 class="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
  <p class="text-xl text-gray-600 dark:text-gray-400 mt-4">
    This page doesn't exist
  </p>

<div class="mt-8 space-x-4">
    <a href="/" class="btn-primary">Go Home</a>
    <a href="/docs" class="btn-secondary">View Docs</a>
  </div>
</div>
```

### Error Page with Debug Info

```markdown
---
title: "Server Error"
layout: "minimal"
---

# 500 - Server Error

An unexpected error occurred while processing your request.

**What to do:**

1. Refresh the page
2. Clear your browser cache
3. [Report this issue](https://github.com/yourorg/repo/issues)

If the problem persists, contact support with the timestamp: {currentTime}
```

### Minimal Error Page

```markdown
---
title: "Not Found"
layout: "minimal"
---

# Not Found

[Home](/)
```

## Notes

- Both files are optional - Pages provides simple fallbacks
- Error pages use standard frontmatter and Markdown syntax
- Any layout can be used (default, minimal, custom, etc.)
- Error pages support all Markdown features (HTML, images, links)
- In dev mode, errors are caught and show error page automatically
- In production, hosting platforms can serve 404.html/500.html for errors

## Related

- [Markdown](/pages/markdown) - Writing content with frontmatter
- [Layouts](/pages/layouts) - Creating layouts for error pages
- [Getting Started](/pages/getting-started) - File organization
