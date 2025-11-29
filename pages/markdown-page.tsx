/**
 * Markdown page component wrapper.
 *
 * @module
 */

import type { VNode } from "preact";

/**
 * Props for the MarkdownPage component.
 */
export interface MarkdownPageProps {
  /** Rendered HTML content from markdown */
  html: string;
}

/**
 * Component that renders markdown HTML content.
 *
 * This component wraps pre-rendered markdown HTML in a div,
 * allowing it to be composed with layouts as a VNode.
 *
 * The markdown content is rendered using `dangerouslySetInnerHTML`
 * because markdown is converted to HTML during the build/render phase.
 * This is safe because:
 * 1. The HTML comes from our own markdown renderer
 * 2. User content in markdown is escaped by the markdown parser
 *
 * @example
 * ```tsx
 * const html = await renderMarkdown(content);
 * const element = <MarkdownPage html={html} />;
 * ```
 */
export function MarkdownPage({ html }: MarkdownPageProps): VNode {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
