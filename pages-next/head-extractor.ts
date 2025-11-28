/**
 * Head content extraction from SSR output.
 *
 * @module
 */

import { HEAD_MARKER_ELEMENT } from "./head.tsx";

/**
 * Result of extracting head content from HTML.
 */
export interface HeadExtractionResult {
  /** HTML with head markers removed */
  html: string;
  /** Extracted head content (inner HTML of all Head components) */
  headContent: string;
}

/**
 * Extracts Head component content from SSR-rendered HTML.
 *
 * During SSR, Head components render as `<mage-head data-mage-head="true">...</mage-head>`
 * markers. This function:
 * 1. Finds all markers in the HTML
 * 2. Extracts their inner content
 * 3. Removes the markers from the HTML
 * 4. Returns both the cleaned HTML and the extracted head content
 *
 * @param html SSR-rendered HTML containing head markers
 * @returns Object with cleaned HTML and extracted head content
 *
 * @example
 * ```typescript
 * const rendered = '<div><mage-head><title>Hi</title></mage-head><p>Content</p></div>';
 * const result = extractHeadContent(rendered);
 * // result.html === '<div><p>Content</p></div>'
 * // result.headContent === '<title>Hi</title>'
 * ```
 */
export function extractHeadContent(html: string): HeadExtractionResult {
  // Create regex per call to avoid global state issues with 'g' flag
  const markerRegex = new RegExp(
    `<${HEAD_MARKER_ELEMENT}>([\\s\\S]*?)</${HEAD_MARKER_ELEMENT}>`,
    "g",
  );

  const headParts: string[] = [];

  // Extract content from each marker
  let match: RegExpExecArray | null;
  while ((match = markerRegex.exec(html)) !== null) {
    headParts.push(match[1]);
  }

  // Remove all markers from HTML
  const cleanedHtml = html.replace(markerRegex, "");

  return {
    html: cleanedHtml,
    headContent: headParts.join("\n"),
  };
}
