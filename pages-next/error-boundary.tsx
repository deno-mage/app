/**
 * Error boundary for client-side hydration failures.
 *
 * @module
 */

import { Component, type ComponentChildren } from "preact";

/**
 * Props for the ErrorBoundary component.
 */
export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ComponentChildren;
  /** Optional fallback UI to show when an error occurs */
  fallback?: ComponentChildren;
}

/**
 * State for the ErrorBoundary component.
 */
export interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The caught error, if any */
  error?: Error;
}

/**
 * Error boundary for hydration failures.
 *
 * Catches errors during client-side hydration and displays fallback UI
 * instead of breaking the entire page. The SSR'd content remains visible.
 *
 * If no fallback is provided, returns null - the SSR'd HTML remains
 * functional and visible, providing graceful degradation.
 *
 * @example
 * ```tsx
 * // In client entry point
 * hydrate(
 *   <ErrorBoundary>
 *     <LayoutComponent {...props} />
 *   </ErrorBoundary>,
 *   document.getElementById("app")
 * );
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static override getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: unknown): void {
    console.error("[Mage] Hydration error:", error, errorInfo);
  }

  render(): ComponentChildren {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
