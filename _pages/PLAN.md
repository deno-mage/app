# Pages Rebuild Plan

## Phase 1: Foundation

- Define new types (`PageComponent`, `LayoutComponent` with `children`)
- Create context system (`FrontmatterContext`, `useFrontmatter` hook)
- Build default system files (`_layout.tsx`, `_html.tsx`, `_not-found.tsx`, `_error.tsx`)
- Directory scanner for `_layout.tsx` discovery

## Phase 2: TSX Pages

- TSX page loader (import, validate `frontmatter` export and default component)
- Nested layout resolver (walk up directory tree, collect `_layout.tsx` files)
- Layout composition (wrap page in layouts, innermost first)
- SSR with `preact-render-to-string`

## Phase 3: Markdown Pages

- Markdown-to-Preact transformer (AST to VNodes, not HTML strings)
- Frontmatter extraction (YAML parsing, same schema as TSX)
- Markdown page component wrapper (renders VNodes, provides frontmatter context)
- Syntax highlighting integration (Shiki, same as current)

## Phase 4: Hydration

- Client entry point generator (per-page or shared bundle strategy TBD)
- Hydration script injection
- Markdown DOM extraction (read from DOM, don't re-ship content)
- Error boundary wrapper

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
