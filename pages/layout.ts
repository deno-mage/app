/**
 * Layout resolution and rendering utilities.
 *
 * @module
 */

import { join } from "@std/path";
import { toFileUrl } from "@std/path/to-file-url";
import type { Frontmatter, LayoutComponent, LayoutProps } from "./types.ts";

/**
 * Resolves a layout name to a file path.
 *
 * Maps layout name to `layouts/{name}.tsx` relative to rootDir.
 * Defaults to "default" if no layout specified.
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
    // Convert to absolute file URL for dynamic import
    const absolutePath = toFileUrl(Deno.realPathSync(layoutPath)).href;
    // Add cache-busting query parameter to force reload on every import
    const cacheBustedUrl = `${absolutePath}?t=${Date.now()}`;
    const module = await import(cacheBustedUrl);

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
 * Resolves and loads a layout component from frontmatter.
 *
 * Combines path resolution and loading in one operation.
 *
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
 * Merges HTML content with frontmatter metadata, nesting custom fields
 * in additionalFrontmatter to avoid prop conflicts.
 */
export function buildLayoutProps(
  html: string,
  frontmatter: Frontmatter,
): LayoutProps {
  const { title, description, layout: _layout, ...customFields } = frontmatter;

  const props: LayoutProps = {
    html,
    title,
    description,
  };

  // Only add additionalFrontmatter if there are custom fields
  if (Object.keys(customFields).length > 0) {
    props.additionalFrontmatter = customFields;
  }

  return props;
}
