/**
 * TSX page with frontmatter missing required title field.
 */

export const frontmatter = {
  description: "This frontmatter is missing a title",
};

export default function InvalidFrontmatter() {
  return <div>Page with invalid frontmatter</div>;
}
