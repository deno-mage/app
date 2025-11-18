/**
 * Page scanning utilities for discovering markdown files.
 *
 * @module
 */

import { relative } from "@std/path";
import { walk } from "@std/fs";

/**
 * Information about a discovered markdown page.
 */
export interface PageInfo {
  /** Absolute path to the markdown file */
  filePath: string;
  /** URL path for the page (e.g., "/docs/getting-started") */
  urlPath: string;
}

/**
 * Scans a directory for markdown files and generates URL paths.
 *
 * Converts file paths to URL paths:
 * - `pages/index.md` → `/`
 * - `pages/docs/api.md` → `/docs/api`
 * - `pages/guide/intro.md` → `/guide/intro`
 *
 * @param pagesDir Path to the pages/ directory
 * @returns Array of page information
 */
export async function scanPages(pagesDir: string): Promise<PageInfo[]> {
  const pages: PageInfo[] = [];

  try {
    for await (
      const entry of walk(pagesDir, {
        includeFiles: true,
        exts: [".md"],
      })
    ) {
      if (entry.isFile) {
        const relativePath = relative(pagesDir, entry.path);
        const urlPath = filePathToUrlPath(relativePath);

        pages.push({
          filePath: entry.path,
          urlPath,
        });
      }
    }
  } catch (error) {
    // If directory doesn't exist, return empty array
    if (error instanceof Deno.errors.NotFound) {
      return pages;
    }
    throw error;
  }

  return pages;
}

/**
 * Converts a file path to a URL path.
 *
 * - `index.md` → `/`
 * - `docs/api.md` → `/docs/api`
 * - `guide/intro.md` → `/guide/intro`
 */
function filePathToUrlPath(filePath: string): string {
  // Remove .md extension
  let urlPath = filePath.replace(/\.md$/, "");

  // Convert index to root
  if (urlPath === "index") {
    return "/";
  }

  // Remove /index suffix for nested index files
  urlPath = urlPath.replace(/\/index$/, "");

  // Ensure leading slash
  if (!urlPath.startsWith("/")) {
    urlPath = `/${urlPath}`;
  }

  // Normalize path separators on Windows
  urlPath = urlPath.replace(/\\/g, "/");

  return urlPath;
}
