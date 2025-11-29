/**
 * Static site generator with nested layouts and interactive TSX pages.
 *
 * @module
 */

// Public API
export { pages } from "./api.ts";

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
