/**
 * Default HTML document template.
 *
 * Provides a minimal HTML5 document structure.
 * Override by creating _html.tsx in your pages directory.
 *
 * @module
 */

import type { HtmlTemplateProps } from "../types.ts";

/**
 * Default document template.
 *
 * Renders a minimal HTML5 document with:
 * - UTF-8 charset
 * - Responsive viewport
 * - Title from frontmatter
 * - Optional description meta tag
 * - Additional head content from Head components
 */
export default function DefaultHtml({
  title,
  description,
  children,
  head,
}: HtmlTemplateProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        {head}
      </head>
      <body>
        <div>{children}</div>
      </body>
    </html>
  );
}
