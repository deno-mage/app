/**
 * Tests for Markdown page loader.
 *
 * @module
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { loadMarkdownPage, MarkdownLoadError } from "../md-loader.ts";
import { resolve } from "@std/path";

const FIXTURES_DIR = resolve(import.meta.dirname!, "fixtures");

describe("Markdown Loader", () => {
  describe("loadMarkdownPage", () => {
    it("should load valid markdown page with frontmatter", async () => {
      const filePath = resolve(FIXTURES_DIR, "valid-page.md");
      const page = await loadMarkdownPage({ filePath, pagesDir: FIXTURES_DIR });

      expect(page.frontmatter.title).toBe("Getting Started");
      expect(page.frontmatter.description).toBe("Learn how to use Mage");
      expect(page.frontmatter.author).toBe("Jane Smith");
      expect(typeof page.html).toBe("string");
      // @deno/gfm adds anchor links to headings
      expect(page.html).toContain("Getting Started</h1>");
    });

    it("should render markdown content to HTML", async () => {
      const filePath = resolve(FIXTURES_DIR, "valid-page.md");
      const page = await loadMarkdownPage({ filePath, pagesDir: FIXTURES_DIR });

      expect(page.html).toContain("<strong>markdown</strong>");
      // @deno/gfm adds anchor links to headings
      expect(page.html).toContain("Code Example</h2>");
      expect(page.html).toContain("Features</h2>");
      expect(page.html).toContain("<li>Nested layouts</li>");
    });

    it("should syntax highlight code blocks", async () => {
      const filePath = resolve(FIXTURES_DIR, "valid-page.md");
      const page = await loadMarkdownPage({ filePath, pagesDir: FIXTURES_DIR });

      // Shiki adds spans with syntax highlighting classes
      expect(page.html).toContain("const");
      expect(page.html).toContain("MageApp");
      // Should have pre/code structure from Shiki
      expect(page.html).toContain("<pre");
    });

    it("should use custom shiki theme when provided", async () => {
      const filePath = resolve(FIXTURES_DIR, "valid-page.md");
      const page = await loadMarkdownPage({
        filePath,
        pagesDir: FIXTURES_DIR,
        markdownOptions: { shikiTheme: "github-light" },
      });

      // Should still render with Shiki (different theme, same structure)
      expect(page.html).toContain("<pre");
      expect(page.html).toContain("const");
    });

    it("should handle code blocks without language specifier", async () => {
      const filePath = resolve(FIXTURES_DIR, "code-no-lang.md");
      const page = await loadMarkdownPage({ filePath, pagesDir: FIXTURES_DIR });

      // Should render the code block with "text" fallback
      expect(page.html).toContain("<pre");
      expect(page.html).toContain("plain text code");
    });

    it("should load minimal markdown page with only title", async () => {
      const filePath = resolve(FIXTURES_DIR, "minimal-page.md");
      const page = await loadMarkdownPage({ filePath, pagesDir: FIXTURES_DIR });

      expect(page.frontmatter.title).toBe("Minimal Page");
      expect(page.frontmatter.description).toBeUndefined();
      expect(page.html).toContain("Just the basics.");
    });

    it("should throw MarkdownLoadError for missing frontmatter", async () => {
      const filePath = resolve(FIXTURES_DIR, "missing-frontmatter.md");

      try {
        await loadMarkdownPage({ filePath, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(MarkdownLoadError);
        expect((error as MarkdownLoadError).filePath).toBe(filePath);
        expect((error as MarkdownLoadError).reason).toContain(
          "Missing frontmatter",
        );
      }
    });

    it("should throw MarkdownLoadError for invalid frontmatter (missing title)", async () => {
      const filePath = resolve(FIXTURES_DIR, "invalid-frontmatter.md");

      try {
        await loadMarkdownPage({ filePath, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(MarkdownLoadError);
        expect((error as MarkdownLoadError).reason).toContain(
          "Invalid frontmatter",
        );
        expect((error as MarkdownLoadError).reason).toContain("title");
      }
    });

    it("should throw MarkdownLoadError for invalid YAML", async () => {
      const filePath = resolve(FIXTURES_DIR, "invalid-yaml.md");

      try {
        await loadMarkdownPage({ filePath, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(MarkdownLoadError);
        expect((error as MarkdownLoadError).reason).toContain(
          "Invalid frontmatter YAML",
        );
      }
    });

    it("should throw MarkdownLoadError for non-existent file", async () => {
      const filePath = resolve(FIXTURES_DIR, "does-not-exist.md");

      try {
        await loadMarkdownPage({ filePath, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(MarkdownLoadError);
        expect((error as MarkdownLoadError).reason).toContain(
          "Failed to read file",
        );
      }
    });

    it("should throw MarkdownLoadError for path traversal attempt", async () => {
      const filePath = "/etc/passwd";

      try {
        await loadMarkdownPage({ filePath, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(MarkdownLoadError);
        expect((error as MarkdownLoadError).reason).toContain(
          "Path is outside pages directory",
        );
      }
    });

    it("should throw MarkdownLoadError for relative path", async () => {
      const filePath = "relative/path.md";

      try {
        await loadMarkdownPage({ filePath, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(MarkdownLoadError);
        expect((error as MarkdownLoadError).reason).toBe(
          "Path must be absolute",
        );
      }
    });

    it("should include file path in error message", async () => {
      const filePath = resolve(FIXTURES_DIR, "missing-frontmatter.md");

      try {
        await loadMarkdownPage({ filePath, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain(filePath);
        expect((error as Error).message).toContain(
          "Failed to load markdown page",
        );
      }
    });

    it("should allow custom fields through passthrough", async () => {
      const filePath = resolve(FIXTURES_DIR, "valid-page.md");
      const page = await loadMarkdownPage({ filePath, pagesDir: FIXTURES_DIR });

      expect(page.frontmatter.author).toBe("Jane Smith");
    });
  });

  describe("MarkdownLoadError", () => {
    it("should create error with file path and reason", () => {
      const error = new MarkdownLoadError(
        "/app/pages/test.md",
        "Something went wrong",
      );

      expect(error.name).toBe("MarkdownLoadError");
      expect(error.filePath).toBe("/app/pages/test.md");
      expect(error.reason).toBe("Something went wrong");
      expect(error.message).toBe(
        'Failed to load markdown page "/app/pages/test.md": Something went wrong',
      );
    });

    it("should create error with cause and include cause message", () => {
      const cause = new Error("Original error");
      const error = new MarkdownLoadError(
        "/app/pages/test.md",
        "Read failed",
        cause,
      );

      expect(error.cause).toBe(cause);
      expect(error.message).toContain("Original error");
    });

    it("should be instance of Error", () => {
      const error = new MarkdownLoadError("/app/pages/test.md", "Test reason");
      expect(error).toBeInstanceOf(Error);
    });
  });
});
