/**
 * Tests for default component rendering.
 *
 * @module
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { render } from "preact-render-to-string";
import DefaultHtml from "../defaults/_html.tsx";
import DefaultLayout from "../defaults/_layout.tsx";
import DefaultNotFound, {
  frontmatter as notFoundFrontmatter,
} from "../defaults/_not-found.tsx";
import DefaultError, {
  frontmatter as errorFrontmatter,
} from "../defaults/_error.tsx";

describe("default components", () => {
  describe("_html.tsx", () => {
    it("should render with title and children", () => {
      const html = render(
        <DefaultHtml title="Test Page">
          <div>Page content</div>
        </DefaultHtml>,
      );

      expect(html).toContain('<html lang="en">');
      expect(html).toContain("<title>Test Page</title>");
      expect(html).toContain("<div>Page content</div>");
      expect(html).toContain('charset="UTF-8"');
    });

    it("should render with title, description, and children", () => {
      const html = render(
        <DefaultHtml title="Test Page" description="Test description">
          <div>Page content</div>
        </DefaultHtml>,
      );

      expect(html).toContain("<title>Test Page</title>");
      expect(html).toContain(
        '<meta name="description" content="Test description"/>',
      );
      expect(html).toContain("<div>Page content</div>");
    });

    it("should not render description meta tag when description is undefined", () => {
      const html = render(
        <DefaultHtml title="Test Page">
          <div>Page content</div>
        </DefaultHtml>,
      );

      expect(html).toContain("<title>Test Page</title>");
      expect(html).not.toContain('name="description"');
    });

    it("should include viewport meta tag", () => {
      const html = render(
        <DefaultHtml title="Test Page">
          <div>Content</div>
        </DefaultHtml>,
      );

      expect(html).toContain(
        '<meta name="viewport" content="width=device-width, initial-scale=1.0"/>',
      );
    });

    it("should render children directly in body", () => {
      const html = render(
        <DefaultHtml title="Test Page">
          <main>Main content</main>
        </DefaultHtml>,
      );

      expect(html).toContain("<body><main>Main content</main></body>");
    });

    it("should handle multiple children", () => {
      const html = render(
        <DefaultHtml title="Test Page">
          <header>Header</header>
          <main>Main</main>
          <footer>Footer</footer>
        </DefaultHtml>,
      );

      expect(html).toContain("<header>Header</header>");
      expect(html).toContain("<main>Main</main>");
      expect(html).toContain("<footer>Footer</footer>");
    });

    it("should set lang attribute to en", () => {
      const html = render(
        <DefaultHtml title="Test Page">
          <div>Content</div>
        </DefaultHtml>,
      );

      expect(html).toContain('<html lang="en">');
    });

    it("should render with empty description string", () => {
      const html = render(
        <DefaultHtml title="Test Page" description="">
          <div>Content</div>
        </DefaultHtml>,
      );

      expect(html).toContain("<title>Test Page</title>");
      expect(html).not.toContain('name="description"');
    });
  });

  describe("_layout.tsx", () => {
    it("should render children without wrapper", () => {
      const html = render(
        <DefaultLayout>
          <div>Page content</div>
        </DefaultLayout>,
      );

      expect(html).toBe("<div>Page content</div>");
    });

    it("should pass through multiple children", () => {
      const html = render(
        <DefaultLayout>
          <header>Header</header>
          <main>Main</main>
        </DefaultLayout>,
      );

      expect(html).toBe("<header>Header</header><main>Main</main>");
    });

    it("should pass through nested components", () => {
      const html = render(
        <DefaultLayout>
          <div>
            <h1>Title</h1>
            <p>Content</p>
          </div>
        </DefaultLayout>,
      );

      expect(html).toBe("<div><h1>Title</h1><p>Content</p></div>");
    });

    it("should handle string children", () => {
      const html = render(<DefaultLayout>Plain text</DefaultLayout>);

      expect(html).toBe("Plain text");
    });

    it("should handle mixed children types", () => {
      const html = render(
        <DefaultLayout>
          Text before
          <div>Component</div>
          Text after
        </DefaultLayout>,
      );

      expect(html).toContain("Text before");
      expect(html).toContain("<div>Component</div>");
      expect(html).toContain("Text after");
    });
  });

  describe("_not-found.tsx", () => {
    it("should render 404 message", () => {
      const html = render(<DefaultNotFound />);

      expect(html).toContain("<main>");
      expect(html).toContain("<h1>404 - Page Not Found</h1>");
      expect(html).toContain(
        "<p>The page you requested could not be found.</p>",
      );
      expect(html).toContain("</main>");
    });

    it("should have correct frontmatter", () => {
      expect(notFoundFrontmatter.title).toBe("Page Not Found");
      expect(notFoundFrontmatter.description).toBe(
        "The requested page could not be found.",
      );
    });

    it("should export frontmatter object", () => {
      expect(notFoundFrontmatter).toBeDefined();
      expect(typeof notFoundFrontmatter).toBe("object");
    });

    it("should render complete html structure", () => {
      const html = render(<DefaultNotFound />);

      expect(html).toMatch(
        /<main>.*<h1>404 - Page Not Found<\/h1>.*<p>.*<\/p>.*<\/main>/s,
      );
    });
  });

  describe("_error.tsx", () => {
    it("should render error message without error details", () => {
      const html = render(<DefaultError />);

      expect(html).toContain("<main>");
      expect(html).toContain("<h1>500 - Server Error</h1>");
      expect(html).toContain("<p>An unexpected error occurred.</p>");
      expect(html).toContain("</main>");
    });

    it("should render with custom status code", () => {
      const html = render(<DefaultError statusCode={503} />);

      expect(html).toContain("<h1>503 - Server Error</h1>");
    });

    it("should not show error details in production", () => {
      const error = new Error("Test error message");
      error.stack = "Error: Test error\n  at line 1";

      const originalEnv = Deno.env.get("DENO_ENV");
      try {
        Deno.env.set("DENO_ENV", "production");

        const html = render(<DefaultError error={error} statusCode={500} />);

        expect(html).not.toContain("Error Details");
        expect(html).not.toContain("Test error message");
        expect(html).not.toContain("<details>");
      } finally {
        if (originalEnv) {
          Deno.env.set("DENO_ENV", originalEnv);
        } else {
          Deno.env.delete("DENO_ENV");
        }
      }
    });

    it("should show error details in development", () => {
      const error = new Error("Test error message");
      error.stack = "Error: Test error\n  at TestFile.ts:10";

      const originalEnv = Deno.env.get("DENO_ENV");
      try {
        Deno.env.delete("DENO_ENV");

        const html = render(<DefaultError error={error} statusCode={500} />);

        expect(html).toContain("<details>");
        expect(html).toContain("<summary>Error Details</summary>");
        expect(html).toContain("Error: Test error");
        expect(html).toContain("at TestFile.ts:10");
      } finally {
        if (originalEnv) {
          Deno.env.set("DENO_ENV", originalEnv);
        }
      }
    });

    it("should show error message when no stack trace", () => {
      const error = new Error("Simple error");
      delete error.stack;

      const originalEnv = Deno.env.get("DENO_ENV");
      try {
        Deno.env.delete("DENO_ENV");

        const html = render(<DefaultError error={error} statusCode={500} />);

        expect(html).toContain("<details>");
        expect(html).toContain("Simple error");
      } finally {
        if (originalEnv) {
          Deno.env.set("DENO_ENV", originalEnv);
        }
      }
    });

    it("should have correct frontmatter", () => {
      expect(errorFrontmatter.title).toBe("Server Error");
      expect(errorFrontmatter.description).toBe(
        "An unexpected error occurred.",
      );
    });

    it("should export frontmatter object", () => {
      expect(errorFrontmatter).toBeDefined();
      expect(typeof errorFrontmatter).toBe("object");
    });

    it("should handle undefined error gracefully", () => {
      const html = render(<DefaultError statusCode={500} />);

      expect(html).toContain("<h1>500 - Server Error</h1>");
      expect(html).toContain("<p>An unexpected error occurred.</p>");
    });

    it("should default to status code 500 when not provided", () => {
      const html = render(<DefaultError />);

      expect(html).toContain("<h1>500 - Server Error</h1>");
    });

    it("should render complete html structure", () => {
      const html = render(<DefaultError statusCode={500} />);

      expect(html).toMatch(
        /<main>.*<h1>500 - Server Error<\/h1>.*<p>.*<\/p>.*<\/main>/s,
      );
    });

    it("should handle error with only message property", () => {
      const error = { message: "Custom error" } as Error;

      const originalEnv = Deno.env.get("DENO_ENV");
      try {
        Deno.env.delete("DENO_ENV");

        const html = render(<DefaultError error={error} statusCode={500} />);

        expect(html).toContain("Custom error");
      } finally {
        if (originalEnv) {
          Deno.env.set("DENO_ENV", originalEnv);
        }
      }
    });
  });
});
