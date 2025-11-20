/**
 * Declarative head element management for layouts.
 *
 * @module
 */

import type { ComponentChildren, VNode } from "preact";

export interface HeadProps {
  children: ComponentChildren;
}

/**
 * Declarative head element management for layouts.
 *
 * During SSR: Renders to a marker for extraction.
 * On client: Returns null (head already exists).
 *
 * @param props Component props
 * @returns Head marker during SSR, null on client
 */
export function Head({ children }: HeadProps): VNode | null {
  // SSR: render to marker for extraction
  if (typeof window === "undefined") {
    return <head data-mage-head="true">{children}</head>;
  }

  // Client: don't render (head already in document)
  return null;
}
