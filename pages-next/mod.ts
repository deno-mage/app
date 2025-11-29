/**
 * Static site generator with nested layouts and interactive TSX pages.
 *
 * @module
 */

// Public API
export { pages } from "./api.ts";

// Components for use in pages and layouts
export { Head } from "./head.tsx";
export { useFrontmatter } from "./context.tsx";
export { ErrorBoundary } from "./error-boundary.tsx";
export type { ErrorBoundaryProps } from "./error-boundary.tsx";

// Types for user-defined pages and layouts
export type {
  BuildOptions,
  DevServerOptions,
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
  StaticServerOptions,
} from "./types.ts";
