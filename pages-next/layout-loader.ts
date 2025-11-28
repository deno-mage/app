/**
 * Layout component loader.
 *
 * @module
 */

import { relative } from "@std/path";
import type { LayoutComponent, LayoutInfo } from "./types.ts";

/**
 * A loaded layout component with its directory info.
 */
export interface LoadedLayout {
  /** The layout component (default export) */
  component: LayoutComponent;
  /** Directory path relative to pages root */
  directory: string;
  /** Depth in the directory tree (0 = root) */
  depth: number;
}

/**
 * Options for loading layouts.
 */
export interface LoadLayoutsOptions {
  /** Layout infos from the scanner (ordered by depth) */
  layoutInfos: LayoutInfo[];
  /** Absolute path to the pages directory (for path traversal protection) */
  pagesDir: string;
}

/**
 * Error thrown when a layout fails to load.
 */
export class LayoutLoadError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly reason: string,
    public override readonly cause?: unknown,
  ) {
    const causeMessage = cause instanceof Error ? `: ${cause.message}` : "";
    super(`Failed to load layout "${filePath}": ${reason}${causeMessage}`);
    this.name = "LayoutLoadError";
  }
}

/**
 * Validates that a file path is within the allowed directory.
 *
 * @throws {LayoutLoadError} If path is outside the allowed directory
 */
function validatePath(filePath: string, pagesDir: string): void {
  // Must be absolute path
  if (!filePath.startsWith("/")) {
    throw new LayoutLoadError(filePath, "Path must be absolute");
  }

  // Must be within pagesDir (path traversal protection)
  const relativePath = relative(pagesDir, filePath);
  if (relativePath.startsWith("..")) {
    throw new LayoutLoadError(
      filePath,
      `Path is outside pages directory "${pagesDir}"`,
    );
  }
}

/**
 * Loads a single layout component.
 *
 * @param layoutInfo Layout info from the scanner
 * @param pagesDir Pages directory for path validation
 * @returns The loaded layout
 * @throws {LayoutLoadError} If the layout fails to load or validate
 */
async function loadLayout(
  layoutInfo: LayoutInfo,
  pagesDir: string,
): Promise<LoadedLayout> {
  // Validate path before importing (security)
  validatePath(layoutInfo.filePath, pagesDir);

  let module: Record<string, unknown>;

  try {
    module = await import(layoutInfo.filePath);
  } catch (error) {
    throw new LayoutLoadError(
      layoutInfo.filePath,
      "Failed to import module",
      error,
    );
  }

  // Validate default export exists and is a function
  if (!("default" in module)) {
    throw new LayoutLoadError(
      layoutInfo.filePath,
      "Missing default export. Layout files must have a default export component.",
    );
  }

  if (typeof module.default !== "function") {
    throw new LayoutLoadError(
      layoutInfo.filePath,
      `Default export must be a function (component), got ${typeof module
        .default}`,
    );
  }

  return {
    component: module.default as LayoutComponent,
    directory: layoutInfo.directory,
    depth: layoutInfo.depth,
  };
}

/**
 * Loads multiple layout components.
 *
 * Layouts are returned in the same order as provided (typically root first).
 * This order is important for composition - root layout wraps all others.
 *
 * **Security:** All layout paths are validated to be within pagesDir to prevent
 * path traversal attacks.
 *
 * **Note:** Uses Promise.allSettled to collect all errors when multiple layouts
 * fail, rather than failing fast on the first error.
 *
 * @param options Load options with layoutInfos and pagesDir
 * @returns Array of loaded layouts in the same order
 * @throws {LayoutLoadError} If any layout fails to load (includes all failures in message)
 *
 * @example
 * ```typescript
 * const layoutInfos = getLayoutsForPage("docs/api", allLayouts);
 * const layouts = await loadLayouts({ layoutInfos, pagesDir: "/app/pages" });
 * // layouts[0] is root layout, layouts[n] is closest to page
 * ```
 */
export async function loadLayouts(
  options: LoadLayoutsOptions,
): Promise<LoadedLayout[]> {
  const { layoutInfos, pagesDir } = options;

  if (layoutInfos.length === 0) {
    return [];
  }

  // Load all layouts in parallel
  const results = await Promise.allSettled(
    layoutInfos.map((info) => loadLayout(info, pagesDir)),
  );

  // Collect failures
  const failures: string[] = [];
  const successes: LoadedLayout[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected") {
      const reason = result.reason instanceof Error
        ? result.reason.message
        : String(result.reason);
      failures.push(`${layoutInfos[i].filePath}: ${reason}`);
    } else {
      successes.push(result.value);
    }
  }

  // If any failures, throw with all error messages
  if (failures.length > 0) {
    throw new LayoutLoadError(
      failures.length === 1 ? layoutInfos[0].filePath : "multiple layouts",
      failures.length === 1
        ? failures[0].split(": ").slice(1).join(": ")
        : `Failed to load ${failures.length} layouts:\n  ${
          failures.join("\n  ")
        }`,
    );
  }

  return successes;
}
