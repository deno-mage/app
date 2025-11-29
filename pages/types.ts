/**
 * Type definitions for the pages module.
 *
 * @module
 */

import type { ComponentChildren, JSX, VNode } from "preact";

/**
 * Metadata that can be included in frontmatter.
 *
 * Required for all pages (markdown and TSX).
 */
export interface Frontmatter {
  /** Page title for <title> tag */
  title: string;
  /** Page description for meta tags */
  description?: string;
  /** Allow custom fields */
  [key: string]: unknown;
}

/**
 * Props passed to page components (TSX pages).
 */
export interface PageProps {
  /** Frontmatter metadata for the page */
  frontmatter: Frontmatter;
}

/**
 * A TSX page component.
 *
 * Must export `frontmatter` and a default component.
 */
export type PageComponent = () => VNode | null;

/**
 * Props passed to layout components.
 *
 * Layouts receive children (VNodes), not HTML strings.
 */
export interface LayoutProps {
  /** Child content to render (page or nested layout) */
  children: ComponentChildren;
}

/**
 * A layout component that wraps page content.
 *
 * Layouts compose by directory structure - each _layout.tsx
 * wraps its children, innermost first.
 *
 * **Important:** Layout components MUST render their `children` prop.
 * A layout that doesn't render children will break page composition
 * and result in missing content. Example:
 *
 * ```tsx
 * // CORRECT - renders children
 * export default function Layout({ children }: LayoutProps) {
 *   return <main>{children}</main>;
 * }
 *
 * // WRONG - ignores children, page content will be lost
 * export default function Layout({ children }: LayoutProps) {
 *   return <main>Static content only</main>;
 * }
 * ```
 */
export type LayoutComponent = (props: LayoutProps) => VNode | null;

/**
 * Props passed to error page components.
 */
export interface ErrorPageProps {
  /** The error that occurred */
  error?: Error;
  /** HTTP status code */
  statusCode?: number;
}

/**
 * An error page component (_error.tsx).
 */
export type ErrorPageComponent = (props: ErrorPageProps) => VNode | null;

/**
 * A not found page component (_not-found.tsx).
 */
export type NotFoundPageComponent = () => VNode | null;

/**
 * Props passed to the document template (_html.tsx).
 *
 * Note: Head content from `<Head>` components is automatically extracted
 * and injected into `<head>` after rendering. You don't need to handle
 * head content manually in your template.
 */
export interface HtmlTemplateProps {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Child content (the composed layout + page) */
  children: ComponentChildren;
}

/**
 * The document template component (_html.tsx).
 *
 * Renders the full HTML document structure.
 */
export type HtmlTemplateComponent = (props: HtmlTemplateProps) => JSX.Element;

/**
 * Information about a discovered layout file.
 */
export interface LayoutInfo {
  /** Absolute path to the _layout.tsx file */
  filePath: string;
  /** Directory path relative to pages root (e.g., "", "docs", "docs/api") */
  directory: string;
  /** Depth in the directory tree (0 = root) */
  depth: number;
}

/**
 * Information about a discovered page file.
 */
export interface PageInfo {
  /** Absolute path to the page file */
  filePath: string;
  /** URL path for the page (e.g., "/", "/docs/getting-started") */
  urlPath: string;
  /** File type */
  type: "markdown" | "tsx";
}

/**
 * System files discovered in the pages directory.
 */
export interface SystemFiles {
  /** Path to _html.tsx if present */
  htmlTemplate?: string;
  /** Path to _not-found.tsx if present */
  notFound?: string;
  /** Path to _error.tsx if present */
  error?: string;
  /** All _layout.tsx files by directory */
  layouts: LayoutInfo[];
}

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
 * Options for markdown rendering.
 */
export interface MarkdownOptions {
  /**
   * Shiki theme for syntax highlighting.
   * @default "github-dark"
   */
  shikiTheme?: string;
}

/**
 * Options for the pages module.
 */
export interface PagesOptions {
  /** Site-wide metadata (only required for build, not dev server) */
  siteMetadata?: SiteMetadata;
  /** Markdown rendering options */
  markdownOptions?: MarkdownOptions;
}

/**
 * Options for the dev server.
 */
export interface DevServerOptions {
  /** Root directory containing pages/, public/ */
  rootDir?: string;
  /** Base path for development (e.g., "/docs/") */
  basePath?: string;
  /** Markdown rendering options */
  markdownOptions?: MarkdownOptions;
}

/**
 * Options for building static files.
 */
export interface BuildOptions {
  /** Root directory containing pages/, public/ */
  rootDir?: string;
  /** Output directory for built files */
  outDir?: string;
  /** Base path for deployment (e.g., "/docs/") */
  basePath?: string;
  /** Markdown rendering options */
  markdownOptions?: MarkdownOptions;
}

/**
 * Options for the static server.
 */
export interface StaticServerOptions {
  /** Root directory containing built files (dist/) */
  rootDir?: string;
  /** Base path for deployment (e.g., "/docs/") */
  basePath?: string;
}
