/**
 * Head content extraction from rendered HTML.
 *
 * Extracts <head data-mage-head="true"> markers from rendered layout HTML
 * and returns separated head and body content.
 *
 * @module
 */

/**
 * Result of extracting head content from HTML.
 */
export interface ExtractedHead {
  /** Extracted head content (inner HTML of all Head components) */
  headContent: string;
  /** Body content with Head markers removed */
  bodyContent: string;
}

/**
 * Extracts head content from rendered HTML string.
 *
 * Finds all <head data-mage-head="true">...</head> tags, extracts their
 * inner content, and removes the markers from the body HTML.
 *
 * If multiple Head components exist, concatenates all extracted content
 * in order.
 *
 * @param html Rendered HTML from layout
 * @returns Separated head and body content
 */
export function extractHead(html: string): ExtractedHead {
  const headRegex = /<head\s+data-mage-head="true">([\s\S]*?)<\/head>/g;

  const headParts: string[] = [];
  let match: RegExpExecArray | null;

  // Extract all head content
  while ((match = headRegex.exec(html)) !== null) {
    headParts.push(match[1]);
  }

  // Remove all head markers from body
  const bodyContent = html.replace(headRegex, "");

  // Concatenate all head content
  const headContent = headParts.join("\n");

  return {
    headContent,
    bodyContent,
  };
}
