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
