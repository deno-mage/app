/**
 * Tests for ErrorBoundary component.
 *
 * @module
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { render } from "preact-render-to-string";
import { ErrorBoundary } from "../error-boundary.tsx";

describe("ErrorBoundary", () => {
  it("should render children when no error", () => {
    const html = render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>,
    );

    expect(html).toContain("<div>Content</div>");
  });

  it("should render multiple children", () => {
    const html = render(
      <ErrorBoundary>
        <div>First</div>
        <div>Second</div>
      </ErrorBoundary>,
    );

    expect(html).toContain("<div>First</div>");
    expect(html).toContain("<div>Second</div>");
  });

  it("should render nested components", () => {
    function Child() {
      return <span>Nested</span>;
    }

    const html = render(
      <ErrorBoundary>
        <div>
          <Child />
        </div>
      </ErrorBoundary>,
    );

    expect(html).toContain("<span>Nested</span>");
  });

  it("should accept fallback prop", () => {
    const html = render(
      <ErrorBoundary fallback={<div>Fallback</div>}>
        <div>Content</div>
      </ErrorBoundary>,
    );

    // When no error, renders children not fallback
    expect(html).toContain("<div>Content</div>");
    expect(html).not.toContain("Fallback");
  });

  it("should have correct initial state", () => {
    const boundary = new ErrorBoundary({ children: null });
    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBeUndefined();
  });

  it("should update state on getDerivedStateFromError", () => {
    const error = new Error("Test error");
    const newState = ErrorBoundary.getDerivedStateFromError(error);

    expect(newState.hasError).toBe(true);
    expect(newState.error).toBe(error);
  });

  it("should return null when hasError and no fallback", () => {
    const boundary = new ErrorBoundary({ children: <div>Content</div> });
    boundary.state = { hasError: true, error: new Error("Test") };

    const result = boundary.render();
    expect(result).toBeNull();
  });

  it("should return fallback when hasError and fallback provided", () => {
    const fallback = <div>Error occurred</div>;
    const boundary = new ErrorBoundary({
      children: <div>Content</div>,
      fallback,
    });
    boundary.state = { hasError: true, error: new Error("Test") };

    const result = boundary.render();
    expect(result).toBe(fallback);
  });
});
