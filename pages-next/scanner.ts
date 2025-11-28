/**
 * Directory scanner for discovering pages and system files.
 *
 * @module
 */

import { relative } from "@std/path";
import { walk } from "@std/fs";
import type { LayoutInfo, PageInfo, SystemFiles } from "./types.ts";

/**
 * Scans the pages directory for system files (_layout.tsx, _html.tsx, etc).
 *
 * @param pagesDir Absolute path to the pages directory
 * @returns Discovered system files
 */
export async function scanSystemFiles(pagesDir: string): Promise<SystemFiles> {
  const layouts: LayoutInfo[] = [];
  let htmlTemplate: string | undefined;
  let notFound: string | undefined;
  let error: string | undefined;

  try {
    for await (
      const entry of walk(pagesDir, {
        includeFiles: true,
        includeDirs: false,
        exts: [".tsx"],
      })
    ) {
      if (!entry.isFile) continue;

      const relativePath = relative(pagesDir, entry.path);
      const fileName = entry.name;

      // Root-level system files
      if (relativePath === "_html.tsx") {
        htmlTemplate = entry.path;
        continue;
      }

      if (relativePath === "_not-found.tsx") {
        notFound = entry.path;
        continue;
      }

      if (relativePath === "_error.tsx") {
        error = entry.path;
        continue;
      }

      // Layout files at any level
      if (fileName === "_layout.tsx") {
        const directory = relativePath.replace(/\/_layout\.tsx$/, "").replace(
          /^_layout\.tsx$/,
          "",
        );
        const depth = directory === "" ? 0 : directory.split("/").length;

        layouts.push({
          filePath: entry.path,
          directory,
          depth,
        });
      }
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return { layouts: [] };
    }
    throw err;
  }

  // Sort layouts by depth (root first, then nested)
  layouts.sort((a, b) => a.depth - b.depth);

  return {
    htmlTemplate,
    notFound,
    error,
    layouts,
  };
}

/**
 * Scans the pages directory for page files (markdown and TSX).
 *
 * Excludes system files (files starting with underscore).
 *
 * Skips files in directories starting with underscore.
 *
 * @param pagesDir Absolute path to the pages directory
 * @returns Discovered page files
 */
export async function scanPages(pagesDir: string): Promise<PageInfo[]> {
  const pages: PageInfo[] = [];

  try {
    for await (
      const entry of walk(pagesDir, {
        includeFiles: true,
        includeDirs: false,
        exts: [".md", ".tsx"],
      })
    ) {
      if (!entry.isFile) continue;

      const relativePath = relative(pagesDir, entry.path);

      // Skip system files (files starting with underscore)
      const fileName = entry.name;
      if (fileName.startsWith("_")) {
        continue;
      }

      // Skip files in directories starting with underscore
      if (relativePath.split("/").some((part) => part.startsWith("_"))) {
        continue;
      }

      const type = entry.name.endsWith(".md") ? "markdown" : "tsx";
      const urlPath = filePathToUrlPath(relativePath);

      pages.push({
        filePath: entry.path,
        urlPath,
        type,
      });
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return [];
    }
    throw err;
  }

  return pages;
}

/**
 * Finds all layout files that apply to a given page.
 *
 * Returns layouts from root to the page's directory,
 * ordered for composition (outermost first).
 *
 * @param pageDir Directory containing the page (relative to pages root)
 * @param layouts All discovered layouts
 * @returns Layouts that apply to the page, ordered root to leaf
 *
 * @example
 * ```ts
 * // For page at "docs/api/request.tsx":
 * const applicable = getLayoutsForPage("docs/api", layouts);
 * // Returns layouts for: "", "docs", "docs/api" (if they exist)
 * ```
 */
export function getLayoutsForPage(
  pageDir: string,
  layouts: LayoutInfo[],
): LayoutInfo[] {
  // Normalize pageDir (remove leading/trailing slashes)
  const normalizedDir = pageDir.replace(/^\/+|\/+$/g, "");

  // Build list of directories from root to page
  const dirParts = normalizedDir === "" ? [] : normalizedDir.split("/");
  const ancestorDirs: string[] = [""];

  let currentPath = "";
  for (const part of dirParts) {
    currentPath = currentPath === "" ? part : `${currentPath}/${part}`;
    ancestorDirs.push(currentPath);
  }

  // Find layouts that match any ancestor directory
  const layoutMap = new Map(layouts.map((l) => [l.directory, l]));
  const applicable: LayoutInfo[] = [];

  for (const dir of ancestorDirs) {
    const layout = layoutMap.get(dir);
    if (layout) {
      applicable.push(layout);
    }
  }

  return applicable;
}

/**
 * Converts a file path to a URL path.
 *
 * @param filePath Relative file path from pages directory
 * @returns URL path for the page
 *
 * @example
 * ```ts
 * filePathToUrlPath("index.md") // "/"
 * filePathToUrlPath("docs/api.tsx") // "/docs/api"
 * filePathToUrlPath("guide/intro.md") // "/guide/intro"
 * ```
 */
function filePathToUrlPath(filePath: string): string {
  // Remove extension
  let urlPath = filePath.replace(/\.(md|tsx)$/, "");

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

  // Normalize path separators
  urlPath = urlPath.replace(/\\/g, "/");

  return urlPath;
}

/**
 * Gets the directory of a page from its URL path.
 *
 * @param urlPath URL path for the page
 * @returns Directory path (relative to pages root)
 *
 * @example
 * ```ts
 * getPageDirectory("/") // ""
 * getPageDirectory("/docs/api") // "docs"
 * getPageDirectory("/docs/api/request") // "docs/api"
 * ```
 */
export function getPageDirectory(urlPath: string): string {
  // Remove leading slash
  const path = urlPath.replace(/^\//, "");

  // Root page
  if (path === "") {
    return "";
  }

  // Get parent directory
  const parts = path.split("/");
  if (parts.length === 1) {
    return "";
  }

  return parts.slice(0, -1).join("/");
}
