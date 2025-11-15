import { parse as parseYaml } from "@std/yaml";
import { render as renderGfm } from "@deno/gfm";

/**
 * Frontmatter metadata extracted from markdown files.
 */
export interface Frontmatter {
  title: string;
  slug: string;
  layout: string;
  nav?: string;
  "nav-order"?: number;
  [key: string]: unknown;
}

/**
 * Parsed markdown file with frontmatter and rendered HTML content.
 */
export interface ParsedMarkdown {
  frontmatter: Frontmatter;
  content: string;
  rawMarkdown: string;
}

/**
 * Parse a markdown file with YAML frontmatter.
 *
 * @throws Error if frontmatter is invalid or required fields are missing
 */
export function parseMarkdown(
  fileContent: string,
  filepath: string,
): ParsedMarkdown {
  const { frontmatter, markdown } = extractFrontmatter(fileContent, filepath);
  validateFrontmatter(frontmatter, filepath);

  const content = renderGfm(markdown);
  const rawMarkdown = markdown;

  return { frontmatter, content, rawMarkdown };
}

/**
 * Extract YAML frontmatter from markdown content.
 *
 * @throws Error if frontmatter YAML is invalid
 */
function extractFrontmatter(
  content: string,
  filepath: string,
): { frontmatter: Frontmatter; markdown: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new Error(
      `Missing frontmatter in ${filepath}. Expected format:\n---\ntitle: Page Title\nslug: page-slug\nlayout: docs\n---\n\nMarkdown content...`,
    );
  }

  const [, yamlString, markdown] = match;

  try {
    const frontmatter = parseYaml(yamlString) as Frontmatter;
    return { frontmatter, markdown };
  } catch (error) {
    throw new Error(
      `Invalid YAML frontmatter in ${filepath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Validate required frontmatter fields: title, slug, layout.
 *
 * @throws Error if required fields are missing
 */
function validateFrontmatter(
  frontmatter: Frontmatter,
  filepath: string,
): void {
  const required: Array<keyof Frontmatter> = ["title", "slug", "layout"];
  const missing = required.filter((field) => !frontmatter[field]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required frontmatter fields in ${filepath}: ${
        missing.join(", ")
      }`,
    );
  }

  // Validate slug doesn't contain invalid characters
  const slug = frontmatter.slug;
  if (slug.includes("..") || slug.startsWith("/")) {
    throw new Error(
      `Invalid slug in ${filepath}: "${slug}". Slug cannot contain ".." or start with "/"`,
    );
  }
}
