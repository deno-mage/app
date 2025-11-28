/**
 * Markdown page loader with frontmatter validation.
 *
 * @module
 */

import { parse as parseYaml } from "@std/yaml";
import { render as renderMarkdown } from "@deno/gfm";
import { codeToHtml } from "@shikijs/shiki";
import { relative } from "@std/path";
import { FrontmatterSchema } from "./tsx-loader.ts";
import type { Frontmatter, MarkdownOptions } from "./types.ts";

/** Matches frontmatter block: ---\n{yaml}\n---\n{content} */
const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

/** Matches fenced code blocks: ```lang\n{code}``` */
const CODE_BLOCK_REGEX = /```(\w+)?\n([\s\S]*?)```/g;

/**
 * Options for loading a markdown page.
 */
export interface LoadMarkdownOptions {
  /** Absolute path to the markdown file */
  filePath: string;
  /** Absolute path to the pages directory (for path validation) */
  pagesDir: string;
  /** Markdown rendering options */
  markdownOptions?: MarkdownOptions;
}

/**
 * A loaded markdown page with validated frontmatter and rendered HTML.
 */
export interface LoadedMarkdownPage {
  /** Validated frontmatter metadata */
  frontmatter: Frontmatter;
  /** Rendered HTML content */
  html: string;
}

/**
 * Error thrown when markdown page loading fails.
 */
export class MarkdownLoadError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly reason: string,
    public override readonly cause?: unknown,
  ) {
    const causeMessage = cause instanceof Error ? `: ${cause.message}` : "";
    super(
      `Failed to load markdown page "${filePath}": ${reason}${causeMessage}`,
    );
    this.name = "MarkdownLoadError";
  }
}

/**
 * Validates that the file path is safe to load.
 *
 * @throws {MarkdownLoadError} If path is relative or outside pagesDir
 */
function validatePath(filePath: string, pagesDir: string): void {
  if (!filePath.startsWith("/")) {
    throw new MarkdownLoadError(filePath, "Path must be absolute");
  }

  const relativePath = relative(pagesDir, filePath);
  if (relativePath.startsWith("..")) {
    throw new MarkdownLoadError(
      filePath,
      `Path is outside pages directory "${pagesDir}"`,
    );
  }
}

/**
 * Extracts frontmatter and content from markdown.
 *
 * @throws {MarkdownLoadError} If frontmatter is missing or invalid YAML
 */
function extractFrontmatter(
  markdown: string,
  filePath: string,
): { frontmatter: Record<string, unknown>; content: string } {
  const match = markdown.match(FRONTMATTER_REGEX);

  if (!match) {
    throw new MarkdownLoadError(
      filePath,
      "Missing frontmatter. Markdown pages must start with --- delimited YAML frontmatter.",
    );
  }

  const [, yamlContent, content] = match;

  try {
    const frontmatter = parseYaml(yamlContent) as Record<string, unknown>;
    return { frontmatter, content: content.trim() };
  } catch (error) {
    throw new MarkdownLoadError(filePath, "Invalid frontmatter YAML", error);
  }
}

/**
 * Extracts code blocks, highlights them with Shiki, and returns placeholders.
 */
async function highlightCodeBlocks(
  markdown: string,
  options?: MarkdownOptions,
): Promise<{ processedMarkdown: string; replacements: Map<string, string> }> {
  const matches = [...markdown.matchAll(CODE_BLOCK_REGEX)];

  if (matches.length === 0) {
    return { processedMarkdown: markdown, replacements: new Map() };
  }

  const replacements = new Map<string, string>();
  let processedMarkdown = markdown;
  const theme = options?.shikiTheme ?? "github-dark";

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const [fullMatch, lang, code] = match;
    const placeholder = `<span>SHIKI_BLOCK_${i}</span>`;

    try {
      const highlighted = await codeToHtml(code.trim(), {
        lang: lang || "text",
        theme,
      });

      replacements.set(`<p>${placeholder}</p>`, highlighted);
      processedMarkdown = processedMarkdown.replace(fullMatch, placeholder);
    } catch {
      // If highlighting fails, keep original - will be rendered as plain code
    }
  }

  return { processedMarkdown, replacements };
}

/**
 * Renders markdown content to HTML with syntax highlighting.
 */
async function renderContent(
  content: string,
  options?: MarkdownOptions,
): Promise<string> {
  const { processedMarkdown, replacements } = await highlightCodeBlocks(
    content,
    options,
  );

  let html = renderMarkdown(processedMarkdown);

  for (const [placeholder, highlighted] of replacements) {
    html = html.replace(placeholder, highlighted);
  }

  return html;
}

/**
 * Loads and validates a markdown page.
 *
 * This function:
 * 1. Validates the file path is within pagesDir
 * 2. Reads the markdown file
 * 3. Extracts and validates frontmatter with Zod
 * 4. Renders markdown to HTML with syntax highlighting
 *
 * @param options Load options including file path and pages directory
 * @returns Loaded page with validated frontmatter and rendered HTML
 *
 * @throws {MarkdownLoadError} If file cannot be read, frontmatter is invalid, etc.
 *
 * @example
 * ```typescript
 * const page = await loadMarkdownPage({
 *   filePath: "/app/pages/docs/getting-started.md",
 *   pagesDir: "/app/pages",
 * });
 *
 * console.log(page.frontmatter.title); // "Getting Started"
 * console.log(page.html); // "<h1>Getting Started</h1>..."
 * ```
 */
export async function loadMarkdownPage(
  options: LoadMarkdownOptions,
): Promise<LoadedMarkdownPage> {
  const { filePath, pagesDir, markdownOptions } = options;

  // Validate path
  validatePath(filePath, pagesDir);

  // Read file
  let markdown: string;
  try {
    markdown = await Deno.readTextFile(filePath);
  } catch (error) {
    throw new MarkdownLoadError(filePath, "Failed to read file", error);
  }

  // Extract frontmatter
  const { frontmatter: rawFrontmatter, content } = extractFrontmatter(
    markdown,
    filePath,
  );

  // Validate frontmatter with Zod
  const result = FrontmatterSchema.safeParse(rawFrontmatter);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    throw new MarkdownLoadError(filePath, `Invalid frontmatter: ${issues}`);
  }

  // Render content
  const html = await renderContent(content, markdownOptions);

  return {
    frontmatter: result.data,
    html,
  };
}
