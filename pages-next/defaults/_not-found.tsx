/**
 * Default 404 not found page.
 *
 * Provides a minimal not found page.
 * Override by creating _not-found.tsx in your pages directory.
 *
 * @module
 */

/**
 * Default 404 page component.
 *
 * Renders a simple not found message.
 */
export default function DefaultNotFound() {
  return (
    <main>
      <h1>404 - Page Not Found</h1>
      <p>The page you requested could not be found.</p>
    </main>
  );
}

/**
 * Frontmatter for the not found page.
 */
export const frontmatter = {
  title: "Page Not Found",
  description: "The requested page could not be found.",
};
