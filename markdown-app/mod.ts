/**
 * Markdown App - Build documentation sites with Mage and markdown.
 *
 * Write content in markdown with YAML frontmatter, serve with hot reload during
 * development, and build to static HTML for deployment using Preact TSX templates.
 *
 * @module
 *
 * @example
 * ```typescript
 * import { MageApp } from "@mage/app";
 * import { markdownApp } from "@mage/app/markdown-app";
 *
 * const app = new MageApp();
 * const { register, watch } = markdownApp({
 *   sourceDir: "./docs",
 *   outputDir: "./dist",
 *   layoutDir: "./docs",
 *   basePath: "/",
 *   dev: true,
 * });
 *
 * register(app);
 * await watch();
 * Deno.serve(app.handler);
 * ```
 */

export {
  type MarkdownApp,
  markdownApp,
  type MarkdownAppOptions,
  type SiteMetadata,
} from "./markdown-app.ts";

export { type Frontmatter, frontmatterSchema } from "./parser.ts";
export {
  type NavigationData,
  type NavItem,
  type NavSection,
} from "./navigation.ts";
export { type LayoutProps } from "./template.ts";
export { Head } from "./components.tsx";
