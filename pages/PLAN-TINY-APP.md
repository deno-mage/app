# Client-Side Hydration - Implementation Plan

## Overview

Add client-side hydration to the pages module to enable interactive components
in layouts. Layouts will now render as Preact components that hydrate on the
client, enabling event handlers, state, and dynamic behavior.

**Key principles:**

1. **Simplicity first** - One bundle per page for MVP (optimize later)
2. **Good DX** - Layouts just export Preact components, no special ceremony
3. **Small bundles** - Preact is ~3-4KB, extract article HTML from DOM to avoid
   duplication
4. **Works today** - Markdown pages only for MVP, but designed for future `.tsx`
   pages

## Current Architecture

**What we have:**

- Static site generator with markdown pages
- Preact layouts that **render full HTML documents** (including
  `<!DOCTYPE html>`)
- Pure SSR, no client-side JavaScript
- Asset pipeline with SHA-256 cache-busting

**Build flow:**

```
.md file → parse frontmatter + render markdown → load layout.tsx →
layout returns full HTML document string → replace asset URLs →
write to dist/
```

## New Architecture

**What we're building:**

- Layouts render **body content only** (no more full document)
- New `_html.tsx` template wraps layout output in document shell
- Client bundle per page that hydrates the layout
- `<Head>` component for declarative head management
- Article HTML extracted from DOM (no duplication in props)

**New build flow:**

```
.md file → parse frontmatter + render markdown → load layout.tsx →
layout returns Preact components (body only) →
extract <Head> content → render layout to HTML string →
load _html.tsx template → inject head + body + props →
build client bundle for page → inject bundle script tag →
write to dist/
```

## Design Decisions

### 1. Layout Component Changes

**Before (current):**

```tsx
// layouts/docs.tsx
export default function DocsLayout(props: LayoutProps) {
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <title>${props.title}</title>
  <link rel="stylesheet" href="/public/styles.css">
</head>
<body>
  <div>${props.html}</div>
</body>
</html>`;

  return <div dangerouslySetInnerHTML={{ __html: fullHtml }} />;
}
```

**After (new):**

```tsx
// layouts/docs.tsx
import { Head } from "@mage/app/pages";

export default function DocsLayout(props: LayoutProps) {
  return (
    <>
      <Head>
        <title>{props.title}</title>
        <link rel="stylesheet" href="/public/styles.css" />
      </Head>

      <nav>
        <a href="/">Home</a>
      </nav>

      <main>
        <h1>{props.title}</h1>
        <article
          data-article-html="true"
          dangerouslySetInnerHTML={{ __html: props.html }}
        />
      </main>
    </>
  );
}
```

**Key changes:**

- Layout returns body content only (no `<!DOCTYPE html>`)
- Use `<Head>` component for head elements (extracted during SSR)
- Article content uses `data-article-html="true"` marker for client extraction
- Layout is now a normal Preact component (can have state, hooks, event
  handlers)

### 2. Document Shell Template (_html.tsx)

**Location:** Project root (alongside `pages/`, `layouts/`, `public/`)

**Purpose:** Wraps layout HTML in complete document structure

**Example:**

```tsx
// _html.tsx
export interface HtmlTemplateProps {
  head: string; // Extracted head content (HTML string)
  body: string; // Rendered layout HTML (HTML string)
  bundleUrl?: string; // URL to client bundle (optional)
  props: LayoutProps; // Page props (for conditional logic)
}

export default function HtmlTemplate(
  { head, body, bundleUrl, props }: HtmlTemplateProps,
) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${head}
</head>
<body>
  <div id="app" data-layout="true">${body}</div>
  ${
    bundleUrl
      ? `
    <script>
      window.__PAGE_PROPS__ = ${
        JSON.stringify({
          title: props.title,
          description: props.description,
          // Spread custom fields
          ...Object.fromEntries(
            Object.entries(props).filter(([k]) =>
              !["html", "title", "description"].includes(k)
            ),
          ),
        })
      };
    </script>
    <script type="module" src="${bundleUrl}"></script>
  `
      : ""
  }
</body>
</html>`;
}
```

**Note:** Returns string (not JSX) for full control over document structure.

**Contract:**

- Must export default function
- Receives `HtmlTemplateProps`
- Returns complete HTML document as string (including `<!DOCTYPE html>`)
- Optional bundleUrl - if present, includes hydration script

### 3. Head Component

**Purpose:** Declarative way for layouts to set head elements

**Implementation:**

```tsx
// pages/head.tsx
import { ComponentChildren } from "preact";

export interface HeadProps {
  children: ComponentChildren;
}

/**
 * Declarative head element management for layouts.
 *
 * During SSR: Renders to a marker for extraction.
 * On client: Returns null (head already exists).
 *
 * @example
 * <Head>
 *   <title>My Page</title>
 *   <meta name="description" content="..." />
 * </Head>
 */
export function Head({ children }: HeadProps) {
  // SSR: render to marker for extraction
  if (typeof window === "undefined") {
    return <head data-mage-head="true">{children}</head>;
  }

  // Client: don't render (head already in document)
  return null;
}
```

**Extraction process:**

1. Render layout to string
2. Find `<head data-mage-head="true">...</head>` in output
3. Extract inner HTML
4. Remove entire `<head>...</head>` tag from body HTML
5. Pass extracted content to `_html.tsx` as `head` prop

**Multiple Head components:**

- If layout has multiple `<Head>` components, extract all and concatenate
- Last definition wins for duplicate tags (e.g., multiple `<title>`)

### 4. Client Bundle Building

**Strategy:** One bundle per page (simplest for MVP)

**Bundle contents:**

- Preact runtime (~3-4KB gzipped)
- Layout component code
- Hydration entry point

**Entry point generation:** For each page, generate an entry point:

```tsx
// Generated: __temp__/entries/docs-api.tsx
import { hydrate } from "preact";
import Layout from "../../layouts/docs.tsx";

// Extract article HTML from DOM before hydration
const appRoot = document.getElementById("app");
const articleContainer = appRoot?.querySelector('[data-article-html="true"]');

const props = {
  ...window.__PAGE_PROPS__,
  html: articleContainer ? articleContainer.innerHTML : "",
};

// Hydrate the layout
hydrate(<Layout {...props} />, appRoot);
```

**Build process (esbuild):**

```typescript
// Pseudocode
const result = await esbuild.build({
  entryPoints: [entryPath],
  bundle: true,
  format: "esm",
  target: "es2020",
  minify: true, // Production only
  splitting: false, // Keep bundles independent for MVP
  outdir: tempBundleDir,
  jsxImportSource: "preact",
  jsx: "automatic",
});
```

**Output location:** `dist/__bundles/[page-path]-[hash].js`

**Examples:**

- `/` → `dist/__bundles/index-abc123.js`
- `/docs/api` → `dist/__bundles/docs-api-def456.js`

### 5. Props Serialization

**Server-side:** Serialize props minus `html` field

**Why exclude `html`?**

- Article content is already in the DOM (SSR'd)
- Client extracts it from `[data-article-html="true"]` before hydration
- Avoids ~50% duplication of page content in props script

**What's included:**

```typescript
{
  title: "My Page",
  description: "...",
  // Plus any custom frontmatter fields
  customField: "value"
}
```

**What's excluded:**

- `html` field (extracted from DOM instead)

**Serialization:**

```tsx
<script>
  window.__PAGE_PROPS__ = {
    title: "My Page",
    description: "..."
  };
</script>
```

### 6. Article HTML Extraction

**Flow:**

1. **SSR:** Layout renders with
   `<div data-article-html="true" dangerouslySetInnerHTML={{ __html: props.html }} />`
2. **Browser loads:** Article HTML is visible immediately (SSR'd into DOM)
3. **Bundle loads:** Before hydration, extracts `innerHTML` from
   `[data-article-html="true"]`
4. **Hydration:** Passes extracted HTML to layout as `props.html`
5. **Preact matches:** Sees identical structure, hydration succeeds

**Client extraction code:**

```typescript
const articleContainer = appRoot?.querySelector('[data-article-html="true"]');
const html = articleContainer ? articleContainer.innerHTML : "";
```

**Benefits:**

- No duplication of article content in props
- Smaller page weight
- Article content visible immediately (no FOUC)

## File Structure

**Project structure:**

```
project/
├── _html.tsx              # Document shell template
├── pages/                 # Markdown pages (.md files)
│   ├── index.md
│   └── docs/
│       └── api.md
├── layouts/               # Layout components (.tsx files)
│   ├── default.tsx
│   └── docs.tsx
└── public/                # Static assets
    ├── styles.css
    └── images/

dist/
├── index.html             # / route
├── docs/
│   └── api/
│       └── index.html     # /docs/api route
├── __public/              # Hashed static assets
│   ├── styles-abc123.css
│   └── images/
├── __bundles/             # Page bundles (hashed)
│   ├── index-def456.js
│   └── docs-api-ghi789.js
├── sitemap.xml
└── robots.txt
```

**New files in pages/ module:**

```
pages/
├── head.tsx                    # Head component export
├── bundle-builder.ts           # esbuild integration
├── html-template.ts            # _html.tsx loading and rendering
├── head-extractor.ts           # Extract <Head> from rendered HTML
└── tests/
    ├── bundle-builder.test.ts
    ├── html-template.test.ts
    └── head-extractor.test.ts
```

**Modified files:**

```
pages/
├── renderer.ts                 # Change to new flow
├── build.ts                    # Add bundle building step
├── dev-server.ts               # Serve bundles, watch layouts
├── types.ts                    # Add HtmlTemplateProps
└── mod.ts                      # Export Head component
```

## Implementation Phases

### Phase 1: Document Template System

**Goal:** Introduce `_html.tsx` template without breaking existing layouts

**Tasks:**

1. Create `html-template.ts`:
   - Discover `_html.tsx` in project root
   - Load and validate template (must export default function)
   - Call template with props to get HTML string
   - Handle missing template (error or use default?)

2. Create `HtmlTemplateProps` interface in `types.ts`

3. **Decision point:** How to handle missing `_html.tsx`?
   - **Option A:** Error (force users to create it)
   - **Option B:** Use built-in default template
   - **Recommendation:** Option B for backward compatibility

4. Update `renderer.ts`:
   - After rendering layout, pass to `_html.tsx` template
   - For now, pass layout HTML as both `head` and `body` (temporary)

5. Write tests for template loading and rendering

**Output:** `_html.tsx` system works, but layouts still return full documents

### Phase 2: Head Component & Extraction

**Goal:** Enable declarative head management

**Tasks:**

1. Create `head.tsx`:
   - Export `Head` component
   - Renders to `<head data-mage-head="true">` on server
   - Returns `null` on client

2. Create `head-extractor.ts`:
   - Find all `<head data-mage-head="true">...</head>` in HTML string
   - Extract inner HTML from each
   - Concatenate all extracted head content
   - Remove head markers from original HTML
   - Return `{ headContent, bodyContent }`

3. Export `Head` from `mod.ts`

4. Update `renderer.ts`:
   - After rendering layout, extract head content
   - Pass `headContent` as `head` prop to `_html.tsx`
   - Pass cleaned HTML as `body` prop

5. Write tests for extraction with:
   - Single Head component
   - Multiple Head components
   - Nested Head components
   - No Head component (empty extraction)

**Output:** Layouts can use `<Head>` component, content extracted correctly

### Phase 3: Layout Component Restructuring

**Goal:** Layouts return body content only (breaking change)

**Tasks:**

1. Update fixture layouts in tests:
   - Remove full document structure
   - Use `<Head>` for head elements
   - Return body content only

2. Update `renderer.ts`:
   - Expect layouts to return body-only components
   - No need to extract document structure anymore

3. Update documentation:
   - Migration guide for existing layouts
   - Show before/after examples
   - Explain breaking changes

4. Update all tests to reflect new layout structure

**Output:** Layouts are simpler, only concern themselves with body content

**Breaking change:** Existing layouts must be updated to new structure

### Phase 4: Client Bundle Building (Development)

**Goal:** Build client bundles for pages (dev mode first)

**Tasks:**

1. Create `bundle-builder.ts`:
   - Generate entry point for a page (layout + hydration code)
   - Run esbuild to bundle entry point
   - Return bundle content (in-memory for dev)
   - Include source maps for development

2. Add esbuild dependency to pages module

3. Update `dev-server.ts`:
   - After rendering page HTML, build bundle
   - Serve bundle from `/__bundles/[page-path].js` route
   - Watch layout files for changes
   - Rebuild bundle on layout change
   - Trigger page reload

4. Update `renderer.ts`:
   - Call bundle builder for each page
   - Pass bundle URL to `_html.tsx` as `bundleUrl` prop
   - Serialize props (minus `html`) to `window.__PAGE_PROPS__`

5. Write tests for:
   - Entry point generation
   - esbuild bundling
   - Bundle serving in dev mode

**Output:** Dev server builds and serves bundles, hydration works locally

### Phase 5: Client Bundle Building (Production)

**Goal:** Build optimized bundles for production

**Tasks:**

1. Update `bundle-builder.ts`:
   - Add production mode (minification, no source maps)
   - Hash bundle filename with content hash
   - Write bundle to disk at `dist/__bundles/`
   - Return hashed bundle URL

2. Update `build.ts`:
   - Build bundle for each page during static build
   - Copy bundles to `dist/__bundles/` with hashes
   - Track bundle URLs in asset map (for potential future optimization)

3. Update `assets.ts`:
   - Include bundles in asset pipeline (already hashed by content)

4. Write tests for:
   - Production bundle building
   - Minification
   - Hashing
   - Disk output

**Output:** Production builds include optimized, hashed client bundles

### Phase 6: Props Serialization & Hydration

**Goal:** Complete the hydration loop

**Tasks:**

1. Update entry point generation in `bundle-builder.ts`:
   - Extract article HTML from `[data-article-html="true"]`
   - Merge with `window.__PAGE_PROPS__`
   - Call `hydrate()` with merged props

2. Update `_html.tsx` default template:
   - Serialize props minus `html` field
   - Include bundle script tag if `bundleUrl` provided
   - Add `data-layout="true"` to app root for targeting

3. Test hydration:
   - Verify article content displays immediately (SSR)
   - Verify bundle extracts HTML correctly
   - Verify hydration succeeds without errors
   - Verify interactive features work (event handlers)

4. Write integration tests for full flow:
   - Build page with layout
   - Verify HTML output structure
   - Load in headless browser
   - Verify hydration completes
   - Test interactive behavior

**Output:** Complete working hydration system

### Phase 7: Error Handling & Edge Cases

**Goal:** Handle failures gracefully

**Tasks:**

1. **Bundle build errors:**
   - Show clear error message with file/line
   - Don't crash dev server
   - Show error in browser console

2. **Missing _html.tsx:**
   - Use sensible default template
   - Warn in console during development

3. **Head extraction errors:**
   - Handle malformed Head components
   - Warn and continue with empty head

4. **Hydration errors:**
   - Catch and log hydration mismatches
   - Don't crash the page
   - Show helpful error message

5. **Missing article marker:**
   - Handle layouts without `data-article-html="true"`
   - Default to empty string for `props.html`
   - Warn in development

6. Write tests for all error scenarios

**Output:** Robust system that handles edge cases gracefully

### Phase 8: Documentation & Examples

**Goal:** Make the system easy to understand and use

**Tasks:**

1. Update README:
   - Add "Client-Side Hydration" section
   - Explain when to use (interactive components)
   - Show layout example with event handlers
   - Document Head component
   - Document _html.tsx template

2. Create example project:
   - Simple docs site with interactive components
   - Counter component (canonical example)
   - Tabbed content component
   - Search box component

3. Create migration guide:
   - Before/after layout examples
   - Step-by-step migration instructions
   - Common pitfalls and solutions

4. Document bundle sizes:
   - Typical bundle size (~5-6KB for simple layout)
   - How to analyze bundle contents
   - Future optimization options

5. Add JSDoc to all public APIs:
   - Head component
   - HtmlTemplateProps
   - Bundle builder (if exposed)

**Output:** Clear documentation and working examples

## API Changes

### New Exports

```typescript
// mod.ts
export { Head } from "./head.tsx";
export type { HtmlTemplateProps } from "./types.ts";
```

### Updated Types

```typescript
// types.ts

/**
 * Props passed to the _html.tsx document template.
 */
export interface HtmlTemplateProps {
  /** Extracted head content as HTML string */
  head: string;

  /** Rendered layout HTML as string */
  body: string;

  /** URL to client bundle (if hydration enabled) */
  bundleUrl?: string;

  /** Original page props (for conditional logic in template) */
  props: LayoutProps;
}

/**
 * _html.tsx template function signature.
 */
export type HtmlTemplate = (props: HtmlTemplateProps) => string;
```

### No Breaking Changes to Public API

The `pages()` factory function signature remains unchanged:

```typescript
export function pages(options?: PagesOptions): {
  build: (buildOptions: BuildOptions) => Promise<void>;
  registerDevServer: (router: Router) => void;
};
```

**Breaking change is in layout implementation (user code), not API.**

## Bundle Building Details

### esbuild Configuration

```typescript
const buildConfig: esbuild.BuildOptions = {
  entryPoints: [entryPath],
  bundle: true,
  format: "esm",
  target: "es2020",
  minify: isProduction,
  sourcemap: isDevelopment ? "inline" : false,
  splitting: false, // For MVP, no code splitting
  outdir: outDir,

  // Preact JSX configuration
  jsxImportSource: "preact",
  jsx: "automatic",

  // External modules (none for now, bundle everything)
  external: [],

  // Define for environment
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      isProduction ? "production" : "development",
    ),
  },
};
```

### Entry Point Template

```typescript
// Generated for each page
const entryTemplate = `
import { hydrate } from "preact";
import Layout from "${layoutPath}";

// Extract article HTML from DOM
const appRoot = document.getElementById("app");
const articleContainer = appRoot?.querySelector('[data-article-html="true"]');

const props = {
  ...window.__PAGE_PROPS__,
  html: articleContainer ? articleContainer.innerHTML : "",
};

// Hydrate
hydrate(<Layout {...props} />, appRoot);
`;
```

### Bundle Size Expectations

**Typical bundle breakdown:**

- Preact runtime: ~3-4KB gzipped
- Simple layout: ~1-2KB gzipped
- Entry point: ~0.5KB gzipped
- **Total: ~5-6KB gzipped**

**For complex layouts:**

- With multiple components: ~10-15KB gzipped
- With third-party libraries: Varies (should be measured)

**Future optimization (not MVP):**

- Shared Preact runtime across pages: Save ~3KB per additional page
- Layout-based bundles: One bundle per layout, not per page
- Code splitting: Lazy load components below fold

## Development Experience

### Dev Server Flow

```
1. User requests /docs/api
2. Server renders page:
   - Load markdown
   - Render with layout
   - Extract head content
   - Render _html.tsx with unbundled URL
3. Server builds bundle:
   - Generate entry point
   - Run esbuild (with cache)
   - Serve from memory
4. Browser loads page:
   - HTML displays immediately (SSR)
   - Bundle loads asynchronously
   - Hydration happens
   - Interactive features work
5. User edits layout file:
   - Watcher detects change
   - Rebuild bundle
   - Reload page (full reload for MVP)
```

### Production Build Flow

```
1. Scan pages directory
2. Build asset map
3. For each page:
   - Render markdown
   - Load layout
   - Extract head
   - Build production bundle (minified, hashed)
   - Render _html.tsx with hashed bundle URL
   - Write HTML to dist/
   - Write bundle to dist/__bundles/
4. Copy static assets
5. Generate sitemap/robots
```

### Hot Reload Behavior

**For MVP: Full page reload**

**What triggers reload:**

- Markdown page changes → Rebuild page HTML + bundle → Reload
- Layout changes → Rebuild all pages using that layout → Reload
- `_html.tsx` changes → Rebuild all pages → Reload
- Public assets change → Copy asset → Reload (CSS might flash)

**Future enhancement:**

- HMR for layouts (preserve state during reload)
- CSS hot swap (no full reload)
- Preact Refresh integration

## Testing Strategy

### Unit Tests

1. **Head extraction:**
   - Single Head component
   - Multiple Head components
   - No Head component
   - Malformed Head tags

2. **Bundle builder:**
   - Entry point generation
   - esbuild integration
   - Hash generation
   - Error handling

3. **HTML template:**
   - Template loading
   - Missing template fallback
   - Prop injection
   - Bundle URL inclusion

### Integration Tests

1. **Full build:**
   - Build multiple pages
   - Verify HTML structure
   - Verify bundle output
   - Verify asset hashing

2. **Dev server:**
   - Serve pages
   - Serve bundles
   - Watch and rebuild
   - Hot reload

### End-to-End Tests (Future)

1. **Hydration:**
   - Load page in browser
   - Verify hydration completes
   - Test interactive behavior
   - Verify no hydration errors

2. **Performance:**
   - Measure bundle sizes
   - Verify code splitting (future)
   - Verify caching behavior

## Migration Guide (for Users)

### Before (Current)

```tsx
// layouts/docs.tsx
export default function DocsLayout(props: LayoutProps) {
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <title>${props.title}</title>
  <link rel="stylesheet" href="/public/styles.css">
</head>
<body>
  <h1>${props.title}</h1>
  <div>${props.html}</div>
</body>
</html>`;

  return <div dangerouslySetInnerHTML={{ __html: fullHtml }} />;
}
```

### After (New)

```tsx
// layouts/docs.tsx
import { Head } from "@mage/app/pages";

export default function DocsLayout(props: LayoutProps) {
  return (
    <>
      <Head>
        <title>{props.title}</title>
        <link rel="stylesheet" href="/public/styles.css" />
      </Head>

      <h1>{props.title}</h1>
      <article
        data-article-html="true"
        dangerouslySetInnerHTML={{ __html: props.html }}
      />
    </>
  );
}
```

### New File: _html.tsx (required)

```tsx
// _html.tsx
import { HtmlTemplateProps } from "@mage/app/pages";

export default function HtmlTemplate(
  { head, body, bundleUrl, props }: HtmlTemplateProps,
) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${head}
</head>
<body>
  <div id="app" data-layout="true">${body}</div>
  ${
    bundleUrl
      ? `
    <script>window.__PAGE_PROPS__ = ${
        JSON.stringify({ title: props.title, description: props.description })
      };</script>
    <script type="module" src="${bundleUrl}"></script>
  `
      : ""
  }
</body>
</html>`;
}
```

## Future Enhancements (Not MVP)

### 1. Preact .tsx Pages (Not Markdown)

**Vision:**

```
pages/
├── index.tsx          # Preact component page (not markdown)
└── docs/
    └── api.md         # Markdown page
```

**Implementation:**

- Detect `.tsx` files in pages directory
- Render directly as Preact components (skip markdown parsing)
- Pass props from frontmatter or data fetching
- Use same layout system

### 2. Shared Layout Bundles

**Problem:** Each page bundles its own copy of layout code

**Solution:**

- Build one bundle per unique layout
- All pages using the same layout share the bundle
- Pass page-specific props via inline script per page

**Benefits:**

- Much smaller total bundle size
- Better caching (layout bundle cached across pages)
- Faster page loads for second+ page

**Complexity:**

- Need to track which pages use which layouts
- Need to pass props differently (can't use single `window.__PAGE_PROPS__`)
- Entry point becomes more complex

### 3. Code Splitting & Lazy Loading

**Vision:**

```tsx
const HeavyComponent = lazy(() => import("./heavy-component.tsx"));

export default function Layout(props) {
  return (
    <>
      <Head>...</Head>
      <Suspense fallback={<div>Loading...</div>}>
        <HeavyComponent />
      </Suspense>
    </>
  );
}
```

**Implementation:**

- Enable esbuild splitting
- Generate chunk files
- Load on demand

### 4. Progressive Enhancement

**Vision:** Page works without JavaScript

**Implementation:**

- Server renders full interactive UI (forms, links)
- Client hydration adds progressive enhancements (AJAX, optimistic UI)
- Graceful degradation if JS fails

### 5. Server-Side Data Fetching

**Vision:**

```tsx
// pages/users.tsx
export async function getPageData() {
  const users = await fetchUsers();
  return { users };
}

export default function UsersPage({ users }) {
  return <ul>{users.map((u) => <li>{u.name}</li>)}</ul>;
}
```

**Implementation:**

- Call `getPageData()` during build
- Pass data as props to page component
- Serialize data for client bundle

### 6. Hot Module Reload (HMR)

**Vision:** Edit layout, see changes instantly without losing state

**Implementation:**

- Integrate Preact Refresh
- Update bundle without full page reload
- Preserve component state during updates

## Open Questions

### 1. Default _html.tsx Template

**Question:** Should we provide a default `_html.tsx` if user doesn't create
one?

**Options:**

- **A:** Require users to create it (explicit, no magic)
- **B:** Use built-in default (better backward compatibility)
- **C:** Generate it during first build (scaffolding)

**Recommendation:** B - Use built-in default for smooth migration

### 2. Bundle Building in Dev vs Production

**Question:** Should dev mode bundle optimization differ from production?

**Current plan:**

- Dev: No minification, inline source maps, no hashing
- Prod: Minification, no source maps, content hashing

**Alternative:** Dev could skip bundling entirely, use raw ESM imports

**Recommendation:** Stick with current plan (esbuild is fast enough)

### 3. Multiple Head Components

**Question:** What if layout has multiple `<Head>` components?

**Current plan:** Extract all, concatenate in order

**Edge case:** Duplicate tags (two `<title>` tags)

- **Option A:** Last one wins (browser behavior)
- **Option B:** Error/warn during build
- **Option C:** Deduplicate based on tag type

**Recommendation:** A - Follow browser behavior (last one wins)

### 4. Article Marker Flexibility

**Question:** Should `data-article-html="true"` be required?

**Current plan:** Required for article content extraction

**Alternative:** Make it optional, default to empty string if missing

**Recommendation:** Required for MVP, warn if missing during dev

### 5. Bundle Building Performance

**Question:** How to optimize bundle building for large sites?

**Current plan:** Build bundle per page (potentially slow for 100+ pages)

**Optimizations:**

- Cache bundles based on layout hash
- Parallel bundle building
- Skip unchanged layouts

**Recommendation:** Start simple, optimize if needed

## Success Criteria

### MVP is successful when:

1. ✅ Developer creates `_html.tsx` template (or uses default)
2. ✅ Developer writes layout with `<Head>` component
3. ✅ Developer adds interactive component (button click, state)
4. ✅ Build produces HTML + client bundle
5. ✅ Page loads, HTML visible immediately (SSR)
6. ✅ Bundle loads and hydrates
7. ✅ Interactive component works (event handler fires)
8. ✅ Bundle size is reasonable (~5-6KB for simple layout)
9. ✅ Dev server rebuilds on layout changes
10. ✅ Production build is optimized (minified, hashed)

### Quality criteria:

- No hydration errors in console
- Fast build times (<1s per page for MVP)
- Clear error messages for common mistakes
- Documentation is clear and has examples
- Migration path from current layouts is documented

## Timeline Considerations

**Complexity estimate by phase:**

- Phase 1 (Document template): **Simple** - ~1-2 days
- Phase 2 (Head extraction): **Medium** - ~2-3 days
- Phase 3 (Layout restructure): **Simple** - ~1 day (mostly tests/docs)
- Phase 4 (Bundles dev): **Medium** - ~3-4 days
- Phase 5 (Bundles prod): **Simple** - ~1-2 days
- Phase 6 (Hydration): **Medium** - ~2-3 days
- Phase 7 (Error handling): **Medium** - ~2-3 days
- Phase 8 (Documentation): **Simple** - ~2-3 days

**Total estimate: ~16-24 days of focused work**

**Note:** These are complexity estimates, not deadlines. Each phase should be
done thoroughly with proper testing.

## Dependencies

**New dependencies:**

- `esbuild` - Bundling (fast, well-maintained)
- No changes to Preact version

**Why esbuild:**

- Extremely fast (~10-100x faster than webpack)
- Simple API
- Built-in JSX support
- Good error messages
- Single dependency

## Risk Assessment

### Low Risk

- Head component implementation (straightforward)
- HTML template system (simple abstraction)
- Props serialization (standard pattern)

### Medium Risk

- Bundle building integration (new tooling, esbuild config)
- Head extraction (string parsing, edge cases)
- Dev server watching (file watching can be flaky)

### High Risk

- Hydration mismatches (hard to debug, breaks page)
- Breaking changes to layouts (requires user migration)
- Bundle size creep (easy to add dependencies)

### Mitigation Strategies

1. **Hydration:** Extensive testing, clear error messages, examples
2. **Breaking changes:** Provide default `_html.tsx`, clear migration guide
3. **Bundle size:** Document sizes, add bundle analysis tooling

## Conclusion

This plan provides a complete path from the current static site generator to a
hydration-enabled system that supports interactive components. The phased
approach allows for incremental progress with clear milestones.

**Core principles maintained:**

- Simplicity: One bundle per page, standard patterns
- Good DX: Layouts are just Preact components, no ceremony
- Small bundles: Extract article HTML, Preact is tiny
- Future-ready: Designed for `.tsx` pages, but MVP is markdown-only

**Next steps:**

1. Review and approve plan
2. Start with Phase 1 (document template system)
3. Iterate phase by phase with testing at each step
4. Ship MVP when all phases complete
