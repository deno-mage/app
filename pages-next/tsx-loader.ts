/**
 * TSX page loader with validation.
 *
 * @module
 */

import { relative } from "@std/path";
import { z } from "zod";
import type { Frontmatter, PageComponent } from "./types.ts";

/**
 * Schema for validating frontmatter exports.
 *
 * Requires title, allows description and custom fields.
 */
export const FrontmatterSchema = z
  .object({
    title: z.string().min(1, "Frontmatter title cannot be empty"),
    description: z.string().optional(),
  })
  .passthrough();

/**
 * A loaded TSX page with validated frontmatter.
 */
export interface LoadedPage {
  /** The page component (default export) */
  component: PageComponent;
  /** Validated frontmatter metadata */
  frontmatter: Frontmatter;
}

/**
 * Options for loading a TSX page.
 */
export interface LoadPageOptions {
  /** Absolute path to the TSX page file */
  filePath: string;
  /** Absolute path to the pages directory (for path traversal protection) */
  pagesDir: string;
}

/**
 * Error thrown when a TSX page fails validation.
 */
export class PageLoadError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly reason: string,
    public override readonly cause?: unknown,
  ) {
    const causeMessage = cause instanceof Error ? `: ${cause.message}` : "";
    super(`Failed to load page "${filePath}": ${reason}${causeMessage}`);
    this.name = "PageLoadError";
  }
}

/**
 * Validates that a file path is within the allowed directory.
 *
 * @throws {PageLoadError} If path is outside the allowed directory
 */
function validatePath(filePath: string, pagesDir: string): void {
  // Must be absolute path
  if (!filePath.startsWith("/")) {
    throw new PageLoadError(filePath, "Path must be absolute");
  }

  // Must be within pagesDir (path traversal protection)
  const relativePath = relative(pagesDir, filePath);
  if (relativePath.startsWith("..")) {
    throw new PageLoadError(
      filePath,
      `Path is outside pages directory "${pagesDir}"`,
    );
  }
}

/**
 * Loads and validates a TSX page file.
 *
 * TSX pages must:
 * - Export a `frontmatter` object with at least a `title` string
 * - Have a default export that is a function (the page component)
 *
 * **Security:** The filePath is validated to be within pagesDir to prevent
 * path traversal attacks that could load arbitrary files.
 *
 * @param options Load options with filePath and pagesDir
 * @returns The loaded page component and validated frontmatter
 * @throws {PageLoadError} If the page fails to load or validate
 *
 * @example
 * ```typescript
 * const page = await loadTsxPage({
 *   filePath: "/app/pages/docs/getting-started.tsx",
 *   pagesDir: "/app/pages",
 * });
 * console.log(page.frontmatter.title); // "Getting Started"
 * ```
 */
export async function loadTsxPage(
  options: LoadPageOptions,
): Promise<LoadedPage> {
  const { filePath, pagesDir } = options;

  // Validate path before importing (security)
  validatePath(filePath, pagesDir);

  let module: Record<string, unknown>;

  try {
    module = await import(filePath);
  } catch (error) {
    throw new PageLoadError(filePath, "Failed to import module", error);
  }

  // Validate frontmatter export exists
  if (!("frontmatter" in module)) {
    throw new PageLoadError(
      filePath,
      "Missing 'frontmatter' export. TSX pages must export a frontmatter object.",
    );
  }

  // Validate frontmatter with Zod
  const frontmatterResult = FrontmatterSchema.safeParse(module.frontmatter);
  if (!frontmatterResult.success) {
    const issues = frontmatterResult.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");
    throw new PageLoadError(filePath, `Invalid frontmatter: ${issues}`);
  }

  // Validate default export exists and is a function
  if (!("default" in module)) {
    throw new PageLoadError(
      filePath,
      "Missing default export. TSX pages must have a default export component.",
    );
  }

  if (typeof module.default !== "function") {
    throw new PageLoadError(
      filePath,
      `Default export must be a function (component), got ${typeof module
        .default}`,
    );
  }

  return {
    component: module.default as PageComponent,
    frontmatter: frontmatterResult.data as Frontmatter,
  };
}
