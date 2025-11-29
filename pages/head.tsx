/**
 * Declarative head element management.
 *
 * @module
 */

import type { ComponentChildren, VNode } from "preact";

/**
 * Props for the Head component.
 */
export interface HeadProps {
  /** Elements to add to the document head */
  children: ComponentChildren;
}

/**
 * Custom element name used as marker during SSR.
 */
export const HEAD_MARKER_ELEMENT = "mage-head";

/**
 * Declarative component for adding elements to the document `<head>`.
 *
 * During SSR, renders a marker element that will be extracted and moved
 * to the actual document head. On the client, returns null since the
 * head content already exists in the document.
 *
 * @example
 * ```tsx
 * function MyLayout({ children }) {
 *   return (
 *     <>
 *       <Head>
 *         <link rel="stylesheet" href="/styles.css" />
 *         <meta property="og:title" content="My Page" />
 *       </Head>
 *       <main>{children}</main>
 *     </>
 *   );
 * }
 * ```
 *
 * @example Multiple Head components merge
 * ```tsx
 * // In layout:
 * <Head><link rel="stylesheet" href="/base.css" /></Head>
 *
 * // In page:
 * <Head><link rel="stylesheet" href="/page.css" /></Head>
 *
 * // Result: both stylesheets are included in head
 * ```
 */
export function Head({ children }: HeadProps): VNode | null {
  // Client-side: head content already exists, don't render anything
  if (typeof document !== "undefined") {
    return null;
  }

  // SSR: render marker for extraction
  // @ts-expect-error custom element for SSR marker
  return <mage-head>{children}</mage-head>;
}
