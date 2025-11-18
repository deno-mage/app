/**
 * Page rendering utilities combining markdown parsing and layout rendering.
 *
 * @module
 */

import { render as renderToString } from "preact-render-to-string";
import type { VNode } from "preact";
import { parseAndRender } from "./markdown.ts";
import { buildLayoutProps, resolveLayout } from "./layout.ts";
import { replaceAssetUrls } from "./assets.ts";
import type { Frontmatter } from "./types.ts";

/**
 * Result of rendering a page.
 */
export interface RenderedPage {
  /** Complete HTML document */
  html: string;
  /** Extracted frontmatter */
  frontmatter: Frontmatter;
}

/**
 * Renders a markdown file to a complete HTML page.
 *
 * Combines markdown parsing, layout resolution, Preact rendering,
 * and asset URL replacement into one operation.
 *
 * @param markdownContent Raw markdown content with frontmatter
 * @param rootDir Root directory containing layouts/
 * @param assetMap Map of clean URLs to hashed URLs for asset replacement
 * @returns Complete rendered HTML page
 */
export async function renderPage(
  markdownContent: string,
  rootDir: string,
  assetMap: Map<string, string>,
): Promise<RenderedPage> {
  // Parse markdown and render to HTML
  const { frontmatter, html: contentHtml } = parseAndRender(markdownContent);

  // Load the appropriate layout
  const Layout = await resolveLayout(frontmatter, rootDir);

  // Build props for the layout
  const layoutProps = buildLayoutProps(contentHtml, frontmatter);

  // Render the layout with Preact
  const layoutHtml = renderToString(Layout(layoutProps) as VNode);

  // Replace asset URLs with hashed versions
  const finalHtml = replaceAssetUrls(layoutHtml, assetMap);

  return {
    html: finalHtml,
    frontmatter,
  };
}

/**
 * Renders a markdown file from disk to a complete HTML page.
 *
 * Reads file, parses, renders with layout, and replaces asset URLs.
 *
 * @param filePath Path to the markdown file
 * @param rootDir Root directory containing layouts/
 * @param assetMap Map of clean URLs to hashed URLs
 * @returns Complete rendered HTML page
 */
export async function renderPageFromFile(
  filePath: string,
  rootDir: string,
  assetMap: Map<string, string>,
): Promise<RenderedPage> {
  const content = await Deno.readTextFile(filePath);
  return await renderPage(content, rootDir, assetMap);
}
