/**
 * Server-side rendering for pages.
 *
 * @module
 */

import { render as preactRender } from "preact-render-to-string";
import type { VNode } from "preact";
import { dirname, relative } from "@std/path";
import { composePage } from "./compositor.tsx";
import { extractHeadContent } from "./head-extractor.ts";
import { loadLayouts } from "./layout-loader.ts";
import { getLayoutsForPage } from "./scanner.ts";
import { loadTsxPage } from "./tsx-loader.ts";
import type {
  HtmlTemplateComponent,
  LayoutInfo,
  SystemFiles,
} from "./types.ts";
import DefaultHtml from "./defaults/_html.tsx";
import DefaultLayout from "./defaults/_layout.tsx";

/**
 * Options for rendering a TSX page.
 */
export interface RenderPageOptions {
  /** Absolute path to the TSX page file */
  pagePath: string;
  /** Absolute path to the pages directory */
  pagesDir: string;
  /** Discovered system files (layouts, templates, etc.) */
  systemFiles: SystemFiles;
}

/**
 * Result of rendering a page.
 */
export interface RenderResult {
  /** Complete HTML document */
  html: string;
  /** Page frontmatter (for metadata purposes) */
  frontmatter: {
    title: string;
    description?: string;
    [key: string]: unknown;
  };
}

/**
 * Error thrown when HTML template loading fails.
 */
export class HtmlTemplateError extends Error {
  constructor(
    public readonly templatePath: string,
    public readonly reason: string,
    public override readonly cause?: unknown,
  ) {
    const causeMessage = cause instanceof Error ? `: ${cause.message}` : "";
    super(
      `Failed to load HTML template "${templatePath}": ${reason}${causeMessage}`,
    );
    this.name = "HtmlTemplateError";
  }
}

/**
 * Loads the HTML template component.
 *
 * Uses the user's _html.tsx if provided, otherwise falls back to default.
 *
 * @throws {HtmlTemplateError} If user's template exists but fails to load
 */
async function loadHtmlTemplate(
  systemFiles: SystemFiles,
): Promise<HtmlTemplateComponent> {
  if (!systemFiles.htmlTemplate) {
    return DefaultHtml;
  }

  try {
    const module = await import(systemFiles.htmlTemplate);

    if (typeof module.default !== "function") {
      throw new HtmlTemplateError(
        systemFiles.htmlTemplate,
        `Default export must be a function (component), got ${typeof module
          .default}`,
      );
    }

    return module.default as HtmlTemplateComponent;
  } catch (error) {
    // Re-throw HtmlTemplateError as-is
    if (error instanceof HtmlTemplateError) {
      throw error;
    }
    // Wrap other errors
    throw new HtmlTemplateError(
      systemFiles.htmlTemplate,
      "Failed to import module",
      error,
    );
  }
}

/**
 * Gets layouts applicable to a page, including default if none exist.
 *
 * @throws {Error} If pagePath is outside pagesDir (path traversal protection)
 */
function getApplicableLayouts(
  pagePath: string,
  pagesDir: string,
  systemFiles: SystemFiles,
): LayoutInfo[] {
  const relativePath = relative(pagesDir, pagePath);

  // Path traversal protection
  if (relativePath.startsWith("..")) {
    throw new Error(
      `Page path "${pagePath}" is outside pages directory "${pagesDir}"`,
    );
  }

  const pageDir = dirname(relativePath);
  const normalizedDir = pageDir === "." ? "" : pageDir;

  return getLayoutsForPage(normalizedDir, systemFiles.layouts);
}

/**
 * Injects head content before the closing </head> tag.
 *
 * @param html Full HTML document string
 * @param headContent Content to inject into <head>
 * @returns HTML with head content injected
 */
function injectHeadContent(html: string, headContent: string): string {
  if (!headContent) {
    return html;
  }
  return html.replace("</head>", `${headContent}</head>`);
}

/**
 * Renders a TSX page to a complete HTML document.
 *
 * This is the main rendering orchestration function that:
 * 1. Loads the TSX page component and validates its frontmatter
 * 2. Resolves and loads applicable layouts (nested by directory)
 * 3. Composes the page with layouts and FrontmatterProvider
 * 4. Wraps in HTML template (_html.tsx or default)
 * 5. Renders the full document to HTML via preact-render-to-string
 * 6. Extracts Head component markers and injects content into <head>
 *
 * **Security notes:**
 * - Page and layout paths are validated to prevent path traversal attacks
 *
 * @param options Render options
 * @returns Complete HTML document and page metadata
 *
 * @example
 * ```typescript
 * const systemFiles = await scanSystemFiles(pagesDir);
 * const result = await renderTsxPage({
 *   pagePath: "/app/pages/docs/getting-started.tsx",
 *   pagesDir: "/app/pages",
 *   systemFiles,
 * });
 *
 * console.log(result.html); // <!DOCTYPE html><html>...
 * console.log(result.frontmatter.title); // "Getting Started"
 * ```
 */
export async function renderTsxPage(
  options: RenderPageOptions,
): Promise<RenderResult> {
  const { pagePath, pagesDir, systemFiles } = options;

  // Load the page (with path validation)
  const page = await loadTsxPage({ filePath: pagePath, pagesDir });

  // Get applicable layouts
  const layoutInfos = getApplicableLayouts(pagePath, pagesDir, systemFiles);

  // Load layouts (use default if none found)
  let layouts = await loadLayouts({ layoutInfos, pagesDir });
  if (layouts.length === 0) {
    layouts = [{ component: DefaultLayout, directory: "", depth: 0 }];
  }

  // Load HTML template
  const HtmlTemplate = await loadHtmlTemplate(systemFiles);

  // Create page element
  const PageComponent = page.component;
  const pageElement = <PageComponent />;

  // Compose page with layouts
  const composed = composePage(pageElement, layouts, page.frontmatter);

  // Build complete document as VNode tree
  const fullDocument = (
    <HtmlTemplate
      title={page.frontmatter.title}
      description={page.frontmatter.description}
    >
      {composed}
    </HtmlTemplate>
  );

  // Render the full document to HTML
  const renderedHtml = preactRender(fullDocument);

  // Extract head markers and inject content into <head>
  const { html: cleanedHtml, headContent } = extractHeadContent(renderedHtml);
  const finalHtml = injectHeadContent(cleanedHtml, headContent);

  return {
    html: `<!DOCTYPE html>${finalHtml}`,
    frontmatter: page.frontmatter,
  };
}

/**
 * Renders a VNode tree to HTML without the document wrapper.
 *
 * Useful for rendering page content when you need more control
 * over the HTML template, or for testing.
 *
 * @param tree The component tree to render
 * @returns Rendered HTML string and extracted head content
 */
export function renderToHtml(
  tree: VNode,
): { html: string; headContent: string } {
  const rendered = preactRender(tree);
  return extractHeadContent(rendered);
}
