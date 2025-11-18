/**
 * Simple, convention-based static site generator for Mage apps.
 *
 * Build static sites from Markdown with Preact layouts and file-based routing.
 *
 * @module
 */

export { pages } from "./api.ts";

export type {
  BuildOptions,
  DevServerOptions,
  Frontmatter,
  LayoutComponent,
  LayoutProps,
  PagesOptions,
  SiteMetadata,
  StaticServerOptions,
} from "./types.ts";
