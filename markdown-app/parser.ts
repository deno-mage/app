import { parse as parseYaml } from "@std/yaml";
import { render as renderGfm } from "@deno/gfm";
import { z } from "zod";

/**
 * Zod schema for frontmatter validation with helpful error messages.
 */
export const frontmatterSchema: z.ZodType<
  {
    title: string;
    slug: string;
    layout: string;
    "nav-group"?: string;
    "nav-item"?: string;
    "nav-order"?: number;
    description?: string;
    lastmod?: string;
    changefreq?:
      | "always"
      | "hourly"
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly"
      | "never";
    priority?: number;
    [key: string]: unknown;
  },
  z.ZodTypeDef,
  {
    title: string;
    slug: string;
    layout: string;
    "nav-group"?: string;
    "nav-item"?: string;
    "nav-order"?: number;
    description?: string;
    lastmod?: string | Date;
    changefreq?:
      | "always"
      | "hourly"
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly"
      | "never";
    priority?: number;
    [key: string]: unknown;
  }
> = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  slug: z.string()
    .regex(
      /^[a-z0-9-/]+$/,
      "Slug must contain only lowercase letters, numbers, hyphens, and forward slashes (e.g., 'getting-started' or 'api/reference')",
    )
    .refine(
      (slug) => !slug.includes(".."),
      "Slug cannot contain '..' for security reasons",
    )
    .refine(
      (slug) => !slug.startsWith("/"),
      "Slug should not start with '/' (it will be added automatically)",
    ),
  layout: z.string().min(1, "Layout cannot be empty"),
  "nav-group": z.string().optional(),
  "nav-item": z.string().optional(),
  "nav-order": z.number().int().nonnegative().optional(),
  description: z.string().optional(),
  lastmod: z.union([
    z.string().regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "lastmod must be in YYYY-MM-DD format",
    ),
    z.date().transform((date) => date.toISOString().split("T")[0]),
  ]).optional(),
  changefreq: z.enum([
    "always",
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "yearly",
    "never",
  ]).optional(),
  priority: z.number().min(0.0).max(1.0).optional(),
}).passthrough(); // Allow additional fields

/**
 * Frontmatter metadata extracted from markdown files.
 */
export type Frontmatter = z.infer<typeof frontmatterSchema>;

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

  let content = renderGfm(markdown);

  // Remove anchor links from headings
  content = removeHeaderAnchors(content);

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

  let parsedYaml: unknown;
  try {
    parsedYaml = parseYaml(yamlString);
  } catch (error) {
    throw new Error(
      `Invalid YAML syntax in ${filepath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  // Validate with Zod schema
  const result = frontmatterSchema.safeParse(parsedYaml);
  if (!result.success) {
    const errors = result.error.errors.map((err) => {
      const field = err.path.join(".");
      return `  - ${field}: ${err.message}`;
    }).join("\n");

    throw new Error(
      `Invalid frontmatter in ${filepath}:\n${errors}\n\nExample valid frontmatter:\n---\ntitle: Page Title\nslug: page-slug\nlayout: docs\nnav-item: Section/Item\nnav-group: aside\nnav-order: 1\n---`,
    );
  }

  return { frontmatter: result.data, markdown };
}

/**
 * Remove anchor links from heading tags.
 * GFM adds anchor links with SVG icons to all headings, which can be visually distracting.
 */
function removeHeaderAnchors(html: string): string {
  // Remove the entire <a class="anchor">...</a> element from headings
  // Pattern matches: <a class="anchor" aria-hidden="true" tabindex="-1" href="#...">...</a>
  return html.replace(
    /<a class="anchor"[^>]*>.*?<\/a>/g,
    "",
  );
}
