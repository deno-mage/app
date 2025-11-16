import type { ComponentChildren, JSX } from "preact";

/**
 * Marker for custom head content (scripts, styles, meta tags).
 *
 * Title and description are auto-injected from frontmatter.
 * Multiple Head components are supported and concatenated.
 */
export function Head(
  { children }: { children?: ComponentChildren },
): JSX.Element {
  return <head>{children}</head>;
}
