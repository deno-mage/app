/**
 * Simple, convention-based static site generator for Mage apps.
 *
 * Build static sites from Markdown with Preact layouts and file-based routing.
 *
 * @module
 */

export { pages } from "./api.ts";
export { Head } from "./head.tsx";
export { ErrorBoundary } from "./error-boundary.tsx";

export type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
} from "./error-boundary.tsx";

export type {
  BuildOptions,
  DevServerOptions,
  Frontmatter,
  HtmlTemplate,
  HtmlTemplateProps,
  LayoutComponent,
  LayoutProps,
  PagesOptions,
  SiteMetadata,
  StaticServerOptions,
} from "./types.ts";
