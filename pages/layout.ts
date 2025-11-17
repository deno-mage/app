/**
 * Layout resolution and rendering utilities.
 *
 * @module
 */

import { join } from "@std/path";
import type { Frontmatter, LayoutComponent, LayoutProps } from "./types.ts";

/**
 * Resolves a layout name to a file path.
 *
 * Layout names resolve to `layouts/{name}.tsx` relative to rootDir.
 * If no layout is specified, uses "default".
 *
 * @param layoutName Layout name from frontmatter (or undefined for default)
 * @param rootDir Root directory containing layouts/ folder
 */
export function resolveLayoutPath(
  layoutName: string | undefined,
  rootDir: string,
): string {
  const name = layoutName ?? "default";
  return join(rootDir, "layouts", `${name}.tsx`);
}

/**
 * Loads a layout component from a file path.
 *
 * The layout file must have a default export that is a Preact component.
 *
 * @throws Error if layout file doesn't exist or doesn't have a default export
 */
export async function loadLayout(
  layoutPath: string,
): Promise<LayoutComponent> {
  try {
    const module = await import(layoutPath);

    if (!module.default) {
      throw new Error(
        `Layout file must have a default export: ${layoutPath}`,
      );
    }

    return module.default as LayoutComponent;
  } catch (error) {
    // Check if error message indicates file not found
    if (
      error instanceof Error &&
      (error.message.includes("Module not found") ||
        error.message.includes("Cannot resolve") ||
        error.message.includes("No such file"))
    ) {
      throw new Error(`Layout file not found: ${layoutPath}`);
    }
    throw error;
  }
}

/**
 * Resolves and loads a layout component based on frontmatter.
 *
 * Combines layout path resolution and loading into a single operation.
 *
 * @param frontmatter Frontmatter containing optional layout field
 * @param rootDir Root directory containing layouts/ folder
 * @throws Error if layout cannot be resolved or loaded
 */
export async function resolveLayout(
  frontmatter: Frontmatter,
  rootDir: string,
): Promise<LayoutComponent> {
  const layoutPath = resolveLayoutPath(frontmatter.layout, rootDir);
  return await loadLayout(layoutPath);
}

/**
 * Builds props object for layout component from frontmatter and HTML.
 *
 * Merges HTML content with frontmatter metadata, spreading custom fields.
 */
export function buildLayoutProps(
  html: string,
  frontmatter: Frontmatter,
): LayoutProps {
  const { title, description, layout: _layout, ...customFields } = frontmatter;

  return {
    html,
    title,
    description,
    ...customFields,
  };
}
