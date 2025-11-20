/**
 * Error boundary for hydration failures.
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
 * Catches errors during hydration and displays fallback UI instead of
 * breaking the entire page. The SSR'd content remains visible.
 *
 * Accepts children to wrap and an optional fallback UI to display when
 * errors occur. If no fallback is provided, returns null (SSR'd content
 * remains visible).
 *
 * Note: In production, error boundaries ensure graceful degradation.
 * If hydration fails, the SSR'd HTML remains functional and visible.
 */
export class ErrorBoundary
  extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Updates state when an error is caught.
   *
   * @param error The error that was thrown
   * @returns New state with error information
   */
  static override getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Called when an error is caught during rendering.
   *
   * Logs the error to console for debugging.
   *
   * @param error The error that was thrown
   * @param errorInfo Additional error information from Preact
   */
  override componentDidCatch(error: Error, errorInfo: unknown): void {
    // Log to console for debugging
    console.error("[Mage Pages] Hydration error:", error, errorInfo);
  }

  /**
   * Renders children if no error, or fallback UI if error occurred.
   *
   * @returns Child components or fallback UI
   */
  render(): ComponentChildren {
    if (this.state.hasError) {
      // Return custom fallback or null (SSR'd content remains visible)
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}
