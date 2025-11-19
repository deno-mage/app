/**
 * Type definitions for the pages module.
 *
 * @module
 */

import type { ComponentChildren } from "preact";

/**
 * Metadata that can be included in frontmatter.
 */
export interface Frontmatter {
  /** Page title for <title> tag */
  title: string;
  /** Page description for meta tags */
  description?: string;
  /** Layout name (resolves to layouts/{layout}.tsx) */
  layout?: string;
  /** Allow custom fields */
  [key: string]: unknown;
}

/**
 * Props passed to layout components.
 */
export interface LayoutProps {
  /** Rendered HTML content from markdown */
  html: string;
  /** Page title for <title> tag */
  title: string;
  /** Page description for meta tags */
  description?: string;
  /** Custom metadata fields from frontmatter */
  [key: string]: unknown;
}

/**
 * Layout component type.
 */
export type LayoutComponent = (props: LayoutProps) => ComponentChildren;

/**
 * Site-wide metadata for sitemap and robots.txt generation.
 */
export interface SiteMetadata {
  /** Base URL for the site (e.g., "https://example.com") */
  baseUrl: string;
  /** Site title for meta tags */
  title?: string;
  /** Site description for meta tags */
  description?: string;
}

/**
 * Options for the pages module.
 */
export interface PagesOptions {
  /** Site-wide metadata (only required for build, not dev server) */
  siteMetadata?: SiteMetadata;
}

/**
 * Options for the dev server.
 */
export interface DevServerOptions {
  /** Root directory containing pages/, layouts/, public/ */
  rootDir?: string;
  /** Route to mount the dev server on */
  route?: string;
}

/**
 * Options for building static files.
 */
export interface BuildOptions {
  /** Root directory containing pages/, layouts/, public/ */
  rootDir?: string;
  /** Output directory for built files */
  outDir?: string;
}

/**
 * Options for the static server.
 */
export interface StaticServerOptions {
  /** Root directory containing built files (dist/) */
  rootDir?: string;
  /** Route to mount the static server on */
  route?: string;
}

/**
 * Parsed markdown file with extracted frontmatter and content.
 */
export interface ParsedMarkdown {
  /** Extracted frontmatter metadata */
  frontmatter: Frontmatter;
  /** Markdown content (without frontmatter) */
  content: string;
}

/**
 * Asset map entry for cache-busted assets.
 */
export interface AssetMap {
  /** Map from clean URL to hashed URL */
  map: Map<string, string>;
}

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
