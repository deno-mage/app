/**
 * Valid TSX page with proper frontmatter.
 */

export const frontmatter = {
  title: "Getting Started Guide",
  description: "Learn how to get started with our platform",
  author: "Jane Smith",
  publishDate: "2025-11-28",
};

export default function ValidPage() {
  return (
    <article>
      <h1>Getting Started</h1>
      <p>Welcome to our platform!</p>
    </article>
  );
}
