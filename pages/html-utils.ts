/**
 * HTML/XML utility functions for safe string handling.
 *
 * @module
 */

/**
 * Escapes a string for safe use in XML content or attributes.
 *
 * Uses XML-standard entity references. Safe for both HTML and XML contexts.
 *
 * @param str String to escape
 * @returns Escaped string safe for XML/HTML
 *
 * @example
 * ```typescript
 * const url = escapeXml(userInput);
 * const xml = `<loc>${url}</loc>`;
 * ```
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Escapes a string for safe use in an HTML attribute.
 *
 * Alias for escapeXml - both use the same escaping which is safe
 * for HTML attributes and XML content.
 *
 * @param str String to escape
 * @returns Escaped string safe for HTML attributes
 *
 * @example
 * ```typescript
 * const url = escapeHtmlAttr(userInput);
 * const html = `<a href="${url}">Link</a>`;
 * ```
 */
export const escapeHtmlAttr = escapeXml;
