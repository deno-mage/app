/**
 * Markdown parsing utilities with frontmatter extraction.
 *
 * @module
 */

import { parse as parseYaml } from "@std/yaml";
import { render as renderMarkdown } from "@deno/gfm";
import { codeToHtml } from "@shikijs/shiki";
import type { Frontmatter, ParsedMarkdown } from "./types.ts";

/**
 * Extracts frontmatter and content from a markdown string.
 *
 * Frontmatter must be at the start of the file, enclosed in `---` delimiters.
 * If no frontmatter is found, returns empty frontmatter object.
 *
 * @param markdown Raw markdown content with optional frontmatter
 * @throws Error if frontmatter YAML is invalid
 */
export function parseFrontmatter(markdown: string): ParsedMarkdown {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    // No frontmatter found
    return {
      frontmatter: { title: "" },
      content: markdown,
    };
  }

  const [, yamlContent, content] = match;

  try {
    const frontmatter = parseYaml(yamlContent) as Frontmatter;

    // Validate required fields
    if (!frontmatter.title || typeof frontmatter.title !== "string") {
      throw new Error("Frontmatter must include a 'title' field");
    }

    return {
      frontmatter,
      content: content.trim(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Invalid frontmatter YAML: ${message}`);
  }
}

/**
 * Extracts code blocks from markdown, highlights them, and replaces with placeholders.
 *
 * @returns Object with processed markdown and map of placeholders to highlighted HTML
 */
async function extractAndHighlightCodeBlocks(markdown: string): Promise<{
  processedMarkdown: string;
  replacements: Map<string, string>;
}> {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const matches = [...markdown.matchAll(codeBlockRegex)];

  if (matches.length === 0) {
    return { processedMarkdown: markdown, replacements: new Map() };
  }

  const replacements = new Map<string, string>();
  let processedMarkdown = markdown;

  // Process each code block
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const [fullMatch, lang, code] = match;
    // Use span element with unique ID - @deno/gfm preserves inline HTML
    const placeholder = `<span>SHIKI_BLOCK_${i}</span>`;

    try {
      const highlighted = await codeToHtml(code.trim(), {
        lang: lang || "text",
        theme: "github-dark",
      });

      replacements.set(`<p>${placeholder}</p>`, highlighted);
      processedMarkdown = processedMarkdown.replace(fullMatch, placeholder);
    } catch (error) {
      // If highlighting fails, keep the original code block
      console.warn(
        `Failed to highlight code block with language ${lang}:`,
        error,
      );
    }
  }

  return { processedMarkdown, replacements };
}

/**
 * Renders markdown content to HTML with syntax highlighting.
 *
 * Extracts code blocks, highlights them with Shiki (dual theme support),
 * renders remaining markdown with @deno/gfm, then reinserts highlighted code.
 */
export async function renderToHtml(markdown: string): Promise<string> {
  // Extract and highlight code blocks first
  const { processedMarkdown, replacements } =
    await extractAndHighlightCodeBlocks(
      markdown,
    );

  // Render markdown without code blocks
  let html = renderMarkdown(processedMarkdown);

  // Replace placeholders with highlighted code
  // @deno/gfm wraps the span in a paragraph, so we match <p><span>...</span></p>
  for (const [placeholder, highlighted] of replacements) {
    html = html.replace(placeholder, highlighted);
  }

  return html;
}

/**
 * Parses a markdown file and renders it to HTML.
 *
 * Combines frontmatter extraction and markdown rendering into a single operation.
 *
 * @param markdown Raw markdown content with optional frontmatter
 * @throws Error if frontmatter is invalid or markdown cannot be rendered
 */
export async function parseAndRender(markdown: string): Promise<{
  frontmatter: Frontmatter;
  html: string;
}> {
  const { frontmatter, content } = parseFrontmatter(markdown);
  const html = await renderToHtml(content);

  return {
    frontmatter,
    html,
  };
}
