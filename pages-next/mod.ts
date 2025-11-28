/**
 * Static site generator with nested layouts and interactive TSX pages.
 *
 * @module
 */

// Public API (to be implemented in later phases)
// export { pages } from "./api.ts";

// Components for use in pages and layouts
export { Head } from "./head.tsx";
export { useFrontmatter } from "./context.tsx";
export { ErrorBoundary } from "./error-boundary.tsx";
export type { ErrorBoundaryProps } from "./error-boundary.tsx";

// Types for user-defined pages and layouts
export type {
  Frontmatter,
  HtmlTemplateComponent,
  HtmlTemplateProps,
  LayoutComponent,
  LayoutProps,
  MarkdownOptions,
  PageComponent,
  PageProps,
  PagesOptions,
  SiteMetadata,
} from "./types.ts";
