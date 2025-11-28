/**
 * Server-side rendering for pages.
 *
 * @module
 */

import { render as preactRender } from "preact-render-to-string";
import type { VNode } from "preact";
import { dirname, extname, relative } from "@std/path";
import { composePage } from "./compositor.tsx";
import { extractHeadContent } from "./head-extractor.ts";
import { loadLayouts } from "./layout-loader.ts";
import { loadMarkdownPage } from "./md-loader.ts";
import { MarkdownPage } from "./markdown-page.tsx";
import { getLayoutsForPage } from "./scanner.ts";
import { loadTsxPage } from "./tsx-loader.ts";
import type {
  Frontmatter,
  HtmlTemplateComponent,
  LayoutInfo,
  MarkdownOptions,
  SystemFiles,
} from "./types.ts";
import DefaultHtml from "./defaults/_html.tsx";
import DefaultLayout from "./defaults/_layout.tsx";

/**
 * Options for rendering a page (TSX or Markdown).
 */
export interface RenderPageOptions {
  /** Absolute path to the page file (.tsx or .md) */
  pagePath: string;
  /** Absolute path to the pages directory */
  pagesDir: string;
  /** Discovered system files (layouts, templates, etc.) */
  systemFiles: SystemFiles;
  /** Markdown rendering options (only used for .md files) */
  markdownOptions?: MarkdownOptions;
  /** URL to the client bundle for hydration (omit to disable hydration) */
  bundleUrl?: string;
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
 * Injects hydration scripts before the closing </body> tag.
 *
 * Adds:
 * 1. Inline script with __PAGE_PROPS__ containing frontmatter
 * 2. Script tag loading the page bundle
 *
 * @param html Full HTML document string
 * @param bundleUrl URL to the client bundle
 * @param frontmatter Page frontmatter to pass to client
 * @returns HTML with hydration scripts injected
 */
function injectHydrationScripts(
  html: string,
  bundleUrl: string,
  frontmatter: Frontmatter,
): string {
  const propsScript = `<script>window.__PAGE_PROPS__=${
    JSON.stringify({ frontmatter })
  };</script>`;
  const bundleScript = `<script type="module" src="${bundleUrl}"></script>`;

  return html.replace("</body>", `${propsScript}${bundleScript}</body>`);
}

/**
 * Wraps body content in an #app div for hydration.
 *
 * The hydration entry point expects to find an #app element.
 * This wraps the rendered body content in that div.
 *
 * @param html Full HTML document string
 * @returns HTML with body content wrapped in #app div
 */
function wrapInAppDiv(html: string): string {
  // Match the body content between <body...> and </body>
  return html.replace(
    /(<body[^>]*>)([\s\S]*?)(<\/body>)/,
    '$1<div id="app">$2</div>$3',
  );
}

/**
 * Shared rendering logic for both TSX and Markdown pages.
 *
 * Takes a page element and frontmatter, composes with layouts,
 * wraps in HTML template, and renders to final HTML.
 *
 * If bundleUrl is provided, injects hydration scripts.
 */
async function renderPageInternal(
  pageElement: VNode,
  frontmatter: Frontmatter,
  pagePath: string,
  pagesDir: string,
  systemFiles: SystemFiles,
  bundleUrl?: string,
): Promise<RenderResult> {
  // Get applicable layouts
  const layoutInfos = getApplicableLayouts(pagePath, pagesDir, systemFiles);

  // Load layouts (use default if none found)
  let layouts = await loadLayouts({ layoutInfos, pagesDir });
  if (layouts.length === 0) {
    layouts = [{ component: DefaultLayout, directory: "", depth: 0 }];
  }

  // Load HTML template
  const HtmlTemplate = await loadHtmlTemplate(systemFiles);

  // Compose page with layouts
  const composed = composePage(pageElement, layouts, frontmatter);

  // Build complete document as VNode tree
  const fullDocument = (
    <HtmlTemplate
      title={frontmatter.title}
      description={frontmatter.description}
    >
      {composed}
    </HtmlTemplate>
  );

  // Render the full document to HTML
  const renderedHtml = preactRender(fullDocument);

  // Extract head markers and inject content into <head>
  const { html: cleanedHtml, headContent } = extractHeadContent(renderedHtml);
  let finalHtml = injectHeadContent(cleanedHtml, headContent);

  // If bundle URL provided, inject hydration scripts
  if (bundleUrl) {
    finalHtml = wrapInAppDiv(finalHtml);
    finalHtml = injectHydrationScripts(finalHtml, bundleUrl, frontmatter);
  }

  return {
    html: `<!DOCTYPE html>${finalHtml}`,
    frontmatter,
  };
}

/**
 * Renders a TSX page to a complete HTML document.
 *
 * @param options Render options
 * @returns Complete HTML document and page metadata
 *
 * @example
 * ```typescript
 * const result = await renderTsxPage({
 *   pagePath: "/app/pages/docs/getting-started.tsx",
 *   pagesDir: "/app/pages",
 *   systemFiles,
 * });
 * ```
 */
export async function renderTsxPage(
  options: RenderPageOptions,
): Promise<RenderResult> {
  const { pagePath, pagesDir, systemFiles, bundleUrl } = options;

  // Load the page (with path validation)
  const page = await loadTsxPage({ filePath: pagePath, pagesDir });

  // Create page element
  const PageComponent = page.component;
  const pageElement = <PageComponent />;

  return renderPageInternal(
    pageElement,
    page.frontmatter,
    pagePath,
    pagesDir,
    systemFiles,
    bundleUrl,
  );
}

/**
 * Renders a Markdown page to a complete HTML document.
 *
 * @param options Render options
 * @returns Complete HTML document and page metadata
 *
 * @example
 * ```typescript
 * const result = await renderMarkdownPage({
 *   pagePath: "/app/pages/docs/getting-started.md",
 *   pagesDir: "/app/pages",
 *   systemFiles,
 *   markdownOptions: { shikiTheme: "github-dark" },
 * });
 * ```
 */
export async function renderMarkdownPage(
  options: RenderPageOptions,
): Promise<RenderResult> {
  const { pagePath, pagesDir, systemFiles, markdownOptions, bundleUrl } =
    options;

  // Load the markdown page (with path validation)
  const page = await loadMarkdownPage({
    filePath: pagePath,
    pagesDir,
    markdownOptions,
  });

  // Create page element using MarkdownPage component
  const pageElement = <MarkdownPage html={page.html} />;

  return renderPageInternal(
    pageElement,
    page.frontmatter,
    pagePath,
    pagesDir,
    systemFiles,
    bundleUrl,
  );
}

/**
 * Renders a page (TSX or Markdown) to a complete HTML document.
 *
 * Automatically detects the page type based on file extension
 * and uses the appropriate renderer.
 *
 * This is the main rendering orchestration function that:
 * 1. Detects page type (.tsx or .md)
 * 2. Loads and validates the page
 * 3. Resolves and loads applicable layouts (nested by directory)
 * 4. Composes the page with layouts and FrontmatterProvider
 * 5. Wraps in HTML template (_html.tsx or default)
 * 6. Renders the full document to HTML via preact-render-to-string
 * 7. Extracts Head component markers and injects content into <head>
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
 *
 * // Works with TSX pages
 * const tsxResult = await renderPage({
 *   pagePath: "/app/pages/about.tsx",
 *   pagesDir: "/app/pages",
 *   systemFiles,
 * });
 *
 * // Works with Markdown pages
 * const mdResult = await renderPage({
 *   pagePath: "/app/pages/docs/intro.md",
 *   pagesDir: "/app/pages",
 *   systemFiles,
 *   markdownOptions: { shikiTheme: "github-dark" },
 * });
 * ```
 */
export function renderPage(
  options: RenderPageOptions,
): Promise<RenderResult> {
  const ext = extname(options.pagePath).toLowerCase();

  if (ext === ".md") {
    return renderMarkdownPage(options);
  }

  if (ext === ".tsx") {
    return renderTsxPage(options);
  }

  throw new Error(
    `Unsupported page type "${ext}". Only .tsx and .md files are supported.`,
  );
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
