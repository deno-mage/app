import { join } from "@std/path";
import { copy } from "@std/fs";

const fixturesDir = join(import.meta.dirname!, "fixtures");
const layoutFixture = join(fixturesDir, "layouts", "_layout-docs.tsx");
const layoutWithNavFixture = join(
  fixturesDir,
  "layouts",
  "_layout-docs-with-nav.tsx",
);

/**
 * Setup options for build test helpers.
 */
export interface SetupBuildTestOptions {
  tempDir: string;
  withNav?: boolean;
}

/**
 * Setup directories and layout for build tests.
 * Reduces duplication across build test cases.
 */
export async function setupBuildTest(options: SetupBuildTestOptions) {
  const { tempDir, withNav = false } = options;

  const sourceDir = join(tempDir, "source");
  const outputDir = join(tempDir, "output");
  const layoutDir = join(tempDir, "layouts");

  await Deno.mkdir(sourceDir, { recursive: true });
  await Deno.mkdir(layoutDir, { recursive: true });

  const layout = withNav ? layoutWithNavFixture : layoutFixture;
  await copy(layout, join(layoutDir, "_layout-docs.tsx"));

  return { sourceDir, outputDir, layoutDir };
}

/**
 * Frontmatter fields for markdown file creation.
 */
export interface MarkdownFrontmatter {
  title: string;
  slug: string;
  layout: string;
  description?: string;
  "nav-item"?: string;
  "nav-group"?: string;
  "nav-order"?: number;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
  [key: string]: string | number | undefined;
}

/**
 * Create markdown file content from frontmatter and body.
 * Centralizes markdown file generation for tests.
 */
export function createMarkdownContent(
  frontmatter: MarkdownFrontmatter,
  content: string,
): string {
  const yaml = Object.entries(frontmatter)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  return `---\n${yaml}\n---\n\n${content}`;
}

/**
 * Write a markdown file with frontmatter to the filesystem.
 */
export async function writeMarkdownFile(
  path: string,
  frontmatter: MarkdownFrontmatter,
  content: string,
): Promise<void> {
  await Deno.writeTextFile(path, createMarkdownContent(frontmatter, content));
}

/**
 * Get fixture layout paths.
 */
export function getLayoutFixtures() {
  return {
    docs: layoutFixture,
    docsWithNav: layoutWithNavFixture,
  };
}
