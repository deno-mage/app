/**
 * Client-safe exports from pages module.
 *
 * Only includes components that can be safely bundled for the browser.
 * Does not include server-side functions or imports.
 *
 * @module
 */

export { Head } from "./head.tsx";
export { ErrorBoundary } from "./error-boundary.tsx";

export type { LayoutProps } from "./types.ts";
export type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
} from "./error-boundary.tsx";
