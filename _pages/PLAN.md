# Pages Rebuild Plan

## Phase 1: Foundation ✅

- [x] Define new types (`PageComponent`, `LayoutComponent` with `children`)
- [x] Create context system (`FrontmatterContext`, `useFrontmatter` hook)
- [x] Build default system files (`_layout.tsx`, `_html.tsx`, `_not-found.tsx`,
      `_error.tsx`)
- [x] Directory scanner for `_layout.tsx` discovery

## Phase 2: TSX Pages ✅

- [x] TSX page loader (import, validate `frontmatter` export and default
      component)
- [x] Nested layout resolver (walk up directory tree, collect `_layout.tsx`
      files)
- [x] Layout composition (wrap page in layouts, innermost first)
- [x] SSR with `preact-render-to-string`
- [x] `<Head>` component for declarative head management
- [x] Path traversal protection on dynamic imports
- [x] Zod validation for frontmatter

## Phase 3: Markdown Pages ✅

- [x] Markdown loader (`md-loader.ts`) - reads file, extracts frontmatter,
      validates with Zod
- [x] Frontmatter extraction (YAML parsing, same schema as TSX)
- [x] Markdown page component (`MarkdownPage.tsx`) - wraps HTML in composable
      VNode
- [x] Syntax highlighting integration (Shiki via `@deno/gfm`)
- [x] Unified `renderPage()` function - auto-detects .tsx or .md and renders
      appropriately
- [x] Path traversal protection on markdown loading

## Phase 4: Hydration ✅

- [x] Client entry point generator (per-page bundles)
- [x] Hydration script injection (**PAGE_PROPS**, bundle script)
- [x] #app wrapper for hydration target
- [x] Error boundary wrapper for graceful degradation
- [x] Head component returns null on client (already implemented in Phase 2)

## Phase 5: Production Build

- Static pre-rendering (all pages to HTML)
- Asset hashing and manifest
- Bundle optimization (tree shaking, minification)
- Sitemap and robots.txt generation

## Phase 6: Production Server

- Static file serving
- SPA fallback for client-side navigation (if needed)
- Cache headers

## Phase 7: Optional Features

- UnoCSS integration (detect `uno.config.ts`, generate CSS)
- Base path support (`/docs/` prefix)

## Phase 8: Dev Server

- File watcher (pages, layouts, public assets)
- On-demand page rendering
- Hot reload (WebSocket, full page refresh initially)
- Dev-time error overlay

---

## Open Questions

1. **Bundle strategy**: One bundle per page vs shared chunks?
2. **Client navigation**: Full page loads or client-side routing?
3. **Markdown hydration**: DOM extraction vs dehydrated props?
