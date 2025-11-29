/**
 * Default layout component.
 *
 * A pass-through layout that renders children without wrapper elements.
 * Override by creating _layout.tsx in your pages directory.
 *
 * @module
 */

import type { LayoutProps } from "../types.ts";

/**
 * Default pass-through layout.
 *
 * Simply renders children without any additional structure.
 * This allows pages to control their own markup entirely.
 */
export default function DefaultLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
