/**
 * Page rendering utilities combining markdown parsing and layout rendering.
 *
 * @module
 */

import { render as renderToString } from "preact-render-to-string";
import { h } from "preact";
import { parseAndRender } from "./markdown.ts";
import {
  buildLayoutProps,
  loadLayoutFromBundle,
  resolveLayout,
} from "./layout.ts";
import { replaceAssetUrls } from "./assets.ts";
import { extractHead } from "./head-extractor.ts";
import { loadHtmlTemplate, renderWithTemplate } from "./html-template.tsx";
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
 * Options for rendering a page.
 */
export interface RenderPageOptions {
  /** Map of clean URLs to hashed URLs for asset replacement */
  assetMap: Map<string, string>;
  /** URL to client bundle for hydration */
  bundleUrl: string;
  /** Optional URL to UnoCSS stylesheet */
  stylesheetUrl?: string;
  /** Optional pre-bundled SSR code (bypasses layout resolution and Deno module cache) */
  ssrBundle?: string;
  /** Markdown rendering options */
  markdownOptions?: import("./types.ts").MarkdownOptions;
}

/**
 * Renders a markdown file to a complete HTML page.
 *
 * Combines markdown parsing, layout resolution, Preact rendering,
 * head extraction, HTML template rendering, and asset URL replacement.
 *
 * @param markdownContent Raw markdown content with frontmatter
 * @param rootDir Root directory containing layouts/
 * @param options Rendering options including asset map and bundle URL
 * @returns Complete rendered HTML page with frontmatter
 * @throws Error if markdown is invalid, layout not found, or rendering fails
 */
export async function renderPage(
  markdownContent: string,
  rootDir: string,
  options: RenderPageOptions,
): Promise<RenderedPage> {
  const { assetMap, bundleUrl, stylesheetUrl, ssrBundle, markdownOptions } =
    options;

  // Parse markdown and render to HTML
  const { frontmatter, html: contentHtml } = await parseAndRender(
    markdownContent,
    markdownOptions,
  );

  // Load the appropriate layout:
  // - Dev mode: Use SSR bundle (bypasses Deno module cache for hot reload)
  // - Production: Use regular file import (one-time render, no cache issues)
  const Layout = ssrBundle
    ? await loadLayoutFromBundle(ssrBundle)
    : await resolveLayout(frontmatter, rootDir);

  // Build props for the layout
  const layoutProps = buildLayoutProps(contentHtml, frontmatter);

  // Render the layout with Preact
  const layoutHtml = renderToString(h(Layout, layoutProps));

  // Extract head content from layout
  const { headContent, bodyContent } = extractHead(layoutHtml);

  // Load HTML template
  const template = await loadHtmlTemplate(rootDir);

  // Render with template (injection happens automatically)
  const documentHtml = renderWithTemplate(
    template,
    { layoutProps },
    headContent,
    bodyContent,
    bundleUrl,
    stylesheetUrl,
  );

  // Replace asset URLs with hashed versions
  const finalHtml = replaceAssetUrls(documentHtml, assetMap);

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
 * @param options Rendering options including asset map and bundle URL
 * @returns Complete rendered HTML page with frontmatter
 * @throws Error if file not found, markdown invalid, or rendering fails
 */
export async function renderPageFromFile(
  filePath: string,
  rootDir: string,
  options: RenderPageOptions,
): Promise<RenderedPage> {
  const content = await Deno.readTextFile(filePath);
  return await renderPage(content, rootDir, options);
}
