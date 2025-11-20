/**
 * Shared frontmatter parsing utilities.
 *
 * @module
 */

/**
 * Extracts the layout name from markdown frontmatter.
 *
 * Searches for `layout: name` in the frontmatter section and returns
 * the layout name. Returns "default" if no layout is specified.
 *
 * @param content Markdown content with frontmatter
 * @returns Layout name or "default"
 */
export function extractLayoutName(content: string): string {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    return "default";
  }

  const frontmatter = frontmatterMatch[1];
  const layoutMatch = frontmatter.match(/layout:\s*["']?([^"'\n]+)["']?/);

  return layoutMatch ? layoutMatch[1] : "default";
}
