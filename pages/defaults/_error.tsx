/**
 * Default error page.
 *
 * Provides a minimal error page for server errors.
 * Override by creating _error.tsx in your pages directory.
 *
 * @module
 */

import type { ErrorPageProps } from "../types.ts";

/**
 * Default error page component.
 *
 * Renders error information in development,
 * generic message in production.
 *
 * Production is denoted by DENO_ENV=production.
 */
export default function DefaultError({ error, statusCode }: ErrorPageProps) {
  const isDev = typeof Deno !== "undefined" &&
    Deno.env.get("DENO_ENV") !== "production";

  return (
    <main>
      <h1>{statusCode ?? 500} - Server Error</h1>
      <p>An unexpected error occurred.</p>
      {isDev && error && (
        <details>
          <summary>Error Details</summary>
          <pre>
            <code>{error.stack ?? error.message}</code>
          </pre>
        </details>
      )}
    </main>
  );
}

/**
 * Frontmatter for the error page.
 */
export const frontmatter = {
  title: "Server Error",
  description: "An unexpected error occurred.",
};
