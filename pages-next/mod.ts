/**
 * Static site generator with nested layouts and interactive TSX pages.
 *
 * @module
 */

// Context
export {
  FrontmatterContext,
  FrontmatterProvider,
  useFrontmatter,
} from "./context.tsx";
export type { FrontmatterProviderProps } from "./context.tsx";

// Scanner
export {
  getLayoutsForPage,
  getPageDirectory,
  scanPages,
  scanSystemFiles,
} from "./scanner.ts";

// TSX Loader
export { FrontmatterSchema, loadTsxPage, PageLoadError } from "./tsx-loader.ts";
export type { LoadedPage, LoadPageOptions } from "./tsx-loader.ts";

// Layout Loader
export { LayoutLoadError, loadLayouts } from "./layout-loader.ts";
export type { LoadedLayout, LoadLayoutsOptions } from "./layout-loader.ts";

// Markdown Loader
export { loadMarkdownPage, MarkdownLoadError } from "./md-loader.ts";
export type { LoadedMarkdownPage, LoadMarkdownOptions } from "./md-loader.ts";

// Markdown Page Component
export { MarkdownPage } from "./markdown-page.tsx";
export type { MarkdownPageProps } from "./markdown-page.tsx";

// Head
export { Head, HEAD_MARKER_ELEMENT } from "./head.tsx";
export type { HeadProps } from "./head.tsx";
export { extractHeadContent } from "./head-extractor.ts";
export type { HeadExtractionResult } from "./head-extractor.ts";

// Compositor
export { composePage, composeWithLayout } from "./compositor.tsx";

// Renderer
export {
  HtmlTemplateError,
  renderMarkdownPage,
  renderPage,
  renderToHtml,
  renderTsxPage,
} from "./renderer.tsx";
export type { RenderPageOptions, RenderResult } from "./renderer.tsx";

// Types
export type {
  BuildOptions,
  DevServerOptions,
  ErrorPageComponent,
  ErrorPageProps,
  Frontmatter,
  HtmlTemplateComponent,
  HtmlTemplateProps,
  LayoutComponent,
  LayoutInfo,
  LayoutProps,
  MarkdownOptions,
  NotFoundPageComponent,
  PageComponent,
  PageInfo,
  PageProps,
  PagesOptions,
  SiteMetadata,
  StaticServerOptions,
  SystemFiles,
} from "./types.ts";
