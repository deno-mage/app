/**
 * Markdown parsing utilities with frontmatter extraction.
 *
 * @module
 */

import { parse as parseYaml } from "@std/yaml";
import { render as renderMarkdown } from "@deno/gfm";
import type { Frontmatter, ParsedMarkdown } from "./types.ts";

/**
 * Extracts frontmatter and content from a markdown string.
 *
 * Frontmatter must be at the start of the file, enclosed in `---` delimiters.
 * If no frontmatter is found, returns empty frontmatter object.
 *
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
 * Renders markdown content to HTML.
 *
 * Uses @deno/gfm for GitHub Flavored Markdown rendering with syntax highlighting.
 */
export function renderToHtml(markdown: string): string {
  return renderMarkdown(markdown);
}

/**
 * Parses a markdown file and renders it to HTML.
 *
 * Combines frontmatter extraction and markdown rendering into a single operation.
 *
 * @throws Error if frontmatter is invalid or markdown cannot be rendered
 */
export function parseAndRender(markdown: string): {
  frontmatter: Frontmatter;
  html: string;
} {
  const { frontmatter, content } = parseFrontmatter(markdown);
  const html = renderToHtml(content);

  return {
    frontmatter,
    html,
  };
}
