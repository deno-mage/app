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

## Phase 5: Production Build ✅

- [x] Static pre-rendering (all pages to HTML)
- [x] Asset hashing and manifest
- [x] Bundle optimization (tree shaking, minification)
- [x] Sitemap and robots.txt generation
- [x] Public API: `pages()` factory function with `build()` method

## Phase 6: Production Server ✅

- [x] Static file serving (`registerStaticServer` using `serveFiles` middleware)
- [x] Custom 404 page (`_not-found.html` served on not found)

## Phase 7: Optional Features ✅

- [x] UnoCSS integration (detect `uno.config.ts`, generate CSS)
- [x] Base path support (`/docs/` prefix) - implemented in Phase 5

## Phase 8: Dev Server ✅

- [x] File watcher (pages, layouts, public assets, uno.config.ts)
- [x] On-demand page rendering
- [x] Hot reload (WebSocket, full page refresh)
- [x] Dev-time error overlay

---

## Open Questions

1. **Bundle strategy**: One bundle per page vs shared chunks?
2. **Client navigation**: Full page loads or client-side routing?
3. **Markdown hydration**: DOM extraction vs dehydrated props?
