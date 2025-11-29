/**
 * Tests for error-overlay module.
 *
 * @module
 */

import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { DevErrorOverlay, renderErrorOverlay } from "../error-overlay.tsx";
import { render } from "preact-render-to-string";

describe("DevErrorOverlay", () => {
  describe("error message rendering", () => {
    it("should render the error message", () => {
      const html = render(
        <DevErrorOverlay message="Cannot find module './missing'" />,
      );

      expect(html).toContain("Cannot find module './missing'");
    });

    it("should render multiline error messages", () => {
      const message = "Error on line 1\nError on line 2\nError on line 3";
      const html = render(<DevErrorOverlay message={message} />);

      expect(html).toContain("Error on line 1");
      expect(html).toContain("Error on line 2");
      expect(html).toContain("Error on line 3");
    });
  });

  describe("stack trace rendering", () => {
    it("should render stack trace when provided", () => {
      const stack = `Error: Test
    at renderPage (renderer.tsx:45:10)
    at build.ts:120:5`;

      const html = render(<DevErrorOverlay message="Error" stack={stack} />);

      expect(html).toContain("Stack Trace");
      expect(html).toContain("renderer.tsx:45:10");
      expect(html).toContain("build.ts:120:5");
    });

    it("should not render stack trace section when not provided", () => {
      const html = render(<DevErrorOverlay message="Error" />);

      // Should not have a stack trace section
      // The word "Stack" only appears in "Stack Trace" heading
      const stackTraceMatches = html.match(/Stack Trace/g);
      expect(stackTraceMatches).toBeNull();
    });
  });

  describe("file path rendering", () => {
    it("should render file path when provided", () => {
      const html = render(
        <DevErrorOverlay message="Error" filePath="/app/pages/index.tsx" />,
      );

      expect(html).toContain("/app/pages/index.tsx");
    });

    it("should not render file path section when not provided", () => {
      const html = render(<DevErrorOverlay message="Error" />);

      // File path has its own div, check it's not there
      expect(html).not.toContain('class="file-path"');
    });
  });

  describe("HTML structure", () => {
    it("should render a complete HTML document", () => {
      const html = render(<DevErrorOverlay message="Error" />);

      expect(html).toContain("<html");
      expect(html).toContain("<head>");
      expect(html).toContain("<body>");
      expect(html).toContain("</html>");
    });

    it("should include Build Error heading", () => {
      const html = render(<DevErrorOverlay message="Error" />);

      expect(html).toContain("Build Error");
    });

    it("should include meta viewport for mobile", () => {
      const html = render(<DevErrorOverlay message="Error" />);

      expect(html).toContain('name="viewport"');
      expect(html).toContain("width=device-width");
    });

    it("should include page title", () => {
      const html = render(<DevErrorOverlay message="Error" />);

      expect(html).toContain("<title>Build Error - Mage</title>");
    });
  });

  describe("styling", () => {
    it("should include inline styles", () => {
      const html = render(<DevErrorOverlay message="Error" />);

      expect(html).toContain("<style");
    });

    it("should use monospace font family", () => {
      const html = render(<DevErrorOverlay message="Error" />);

      expect(html).toContain("monospace");
    });

    it("should have dark background for readability", () => {
      const html = render(<DevErrorOverlay message="Error" />);

      expect(html).toContain("#1a1a1a");
    });

    it("should have red accent color for errors", () => {
      const html = render(<DevErrorOverlay message="Error" />);

      expect(html).toContain("#ff6b6b");
    });
  });

  describe("helpful tip", () => {
    it("should include hot reload tip", () => {
      const html = render(<DevErrorOverlay message="Error" />);

      expect(html).toContain("Fix the error and save");
      expect(html).toContain("automatically reload");
    });
  });

  describe("XSS protection", () => {
    it("should escape HTML in error message", () => {
      const html = render(
        <DevErrorOverlay message="<script>alert('xss')</script>" />,
      );

      // Preact escapes < to &lt;
      expect(html).toContain("&lt;script>");
      expect(html).not.toContain("<script>alert");
    });

    it("should escape HTML in stack trace", () => {
      const html = render(
        <DevErrorOverlay
          message="Error"
          stack="<img src=x onerror=alert('xss')>"
        />,
      );

      expect(html).toContain("&lt;img");
      expect(html).not.toContain("<img src=x");
    });

    it("should escape HTML in file path", () => {
      const html = render(
        <DevErrorOverlay
          message="Error"
          filePath="<script>bad</script>"
        />,
      );

      expect(html).toContain("&lt;script>");
      expect(html).not.toContain("<script>bad");
    });
  });
});

describe("renderErrorOverlay", () => {
  describe("document structure", () => {
    it("should return a complete HTML document with DOCTYPE", () => {
      const error = new Error("Test error");
      const html = renderErrorOverlay(error);

      expect(html).toMatch(/^<!DOCTYPE html>/);
      expect(html).toContain("<html");
      expect(html).toContain("</html>");
    });

    it("should include the error message", () => {
      const error = new Error("Module not found: ./missing-file");
      const html = renderErrorOverlay(error);

      expect(html).toContain("Module not found: ./missing-file");
    });
  });

  describe("error handling", () => {
    it("should include stack trace from Error object", () => {
      const error = new Error("Test error");
      const html = renderErrorOverlay(error);

      expect(html).toContain("Stack Trace");
      // Stack trace will contain something like "at Object.<anonymous>"
      expect(html).toContain("at ");
    });

    it("should include file path when provided", () => {
      const error = new Error("Syntax error");
      const html = renderErrorOverlay(error, "/app/pages/broken.tsx");

      expect(html).toContain("/app/pages/broken.tsx");
    });

    it("should handle errors without stack traces", () => {
      const error = new Error("Test");
      error.stack = undefined;
      const html = renderErrorOverlay(error);

      expect(html).toContain("Test");
      // Should not crash
    });
  });

  describe("XSS protection", () => {
    it("should escape malicious content in error message", () => {
      const error = new Error("<img src=x onerror=alert(1)>");
      const html = renderErrorOverlay(error);

      expect(html).not.toContain("<img src=x");
      expect(html).toContain("&lt;img");
    });

    it("should escape malicious content in file path", () => {
      const error = new Error("Error");
      const html = renderErrorOverlay(
        error,
        '"><script>alert(document.cookie)</script>',
      );

      expect(html).not.toContain("<script>alert");
    });
  });

  describe("edge cases", () => {
    it("should handle very long error messages", () => {
      const longMessage = "x".repeat(10000);
      const error = new Error(longMessage);
      const html = renderErrorOverlay(error);

      expect(html).toContain(longMessage);
    });

    it("should handle error messages with special characters", () => {
      const error = new Error("Failed: 'foo' !== \"bar\" && 1 < 2");
      const html = renderErrorOverlay(error);

      expect(html).toContain("'foo'");
      expect(html).toContain("&lt; 2"); // < is escaped
    });

    it("should handle unicode in error messages", () => {
      const error = new Error("Failed: 日本語 emoji 🔥");
      const html = renderErrorOverlay(error);

      expect(html).toContain("日本語");
      expect(html).toContain("🔥");
    });
  });
});
