/**
 * Type definitions for the pages module.
 *
 * @module
 */

import type { ComponentChildren, JSX } from "preact";

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
  /** Additional custom fields from frontmatter */
  additionalFrontmatter?: Record<string, unknown>;
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
  /** Base path for development (e.g., "/docs/" for http://localhost:8000/docs/) */
  basePath?: string;
}

/**
 * Options for building static files.
 */
export interface BuildOptions {
  /** Root directory containing pages/, layouts/, public/ */
  rootDir?: string;
  /** Output directory for built files */
  outDir?: string;
  /** Base path for deployment (e.g., "/docs/" for https://example.com/docs/) */
  basePath?: string;
}

/**
 * Options for the static server.
 */
export interface StaticServerOptions {
  /** Root directory containing built files (dist/) */
  rootDir?: string;
  /** Base path for deployment (e.g., "/docs/" for https://example.com/docs/) */
  basePath?: string;
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
 *
 * The template receives only the page props for conditional rendering.
 * Head content, app wrapper, props script, and bundle script are injected
 * automatically after template rendering.
 */
export interface HtmlTemplateProps {
  /** Layout props for conditional logic in template */
  layoutProps: LayoutProps;
}

/**
 * _html.tsx template component type.
 *
 * Should be a Preact component that returns JSX for the complete HTML document.
 */
export type HtmlTemplate = (props: HtmlTemplateProps) => JSX.Element;
