/**
 * Tests for TSX page loader with validation.
 *
 * @module
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import {
  FrontmatterSchema,
  loadTsxPage,
  PageLoadError,
} from "../tsx-loader.ts";
import { resolve } from "@std/path";

const FIXTURES_DIR = resolve(import.meta.dirname!, "fixtures");

describe("TSX Loader", () => {
  describe("FrontmatterSchema", () => {
    it("should validate frontmatter with required title", () => {
      const result = FrontmatterSchema.safeParse({
        title: "Getting Started",
      });

      expect(result.success).toBe(true);
    });

    it("should validate frontmatter with title and description", () => {
      const result = FrontmatterSchema.safeParse({
        title: "API Documentation",
        description: "Complete API reference",
      });

      expect(result.success).toBe(true);
    });

    it("should allow custom fields through passthrough", () => {
      const result = FrontmatterSchema.safeParse({
        title: "Blog Post",
        description: "A great post",
        author: "Jane Smith",
        tags: ["typescript", "deno"],
        publishDate: "2025-11-28",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.author).toBe("Jane Smith");
        expect(result.data.tags).toEqual(["typescript", "deno"]);
      }
    });

    it("should reject frontmatter missing title", () => {
      const result = FrontmatterSchema.safeParse({
        description: "No title here",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["title"]);
      }
    });

    it("should reject frontmatter with empty title", () => {
      const result = FrontmatterSchema.safeParse({
        title: "",
        description: "Empty title",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Frontmatter title cannot be empty",
        );
      }
    });

    it("should reject frontmatter with non-string title", () => {
      const result = FrontmatterSchema.safeParse({
        title: 123,
      });

      expect(result.success).toBe(false);
    });

    it("should allow missing description", () => {
      const result = FrontmatterSchema.safeParse({
        title: "Minimal Page",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });
  });

  describe("loadTsxPage", () => {
    it("should load valid TSX page with frontmatter", async () => {
      const filePath = resolve(FIXTURES_DIR, "valid-page.tsx");
      const page = await loadTsxPage({ filePath, pagesDir: FIXTURES_DIR });

      expect(page.frontmatter.title).toBe("Getting Started Guide");
      expect(page.frontmatter.description).toBe(
        "Learn how to get started with our platform",
      );
      expect(page.frontmatter.author).toBe("Jane Smith");
      expect(typeof page.component).toBe("function");
    });

    it("should return component that renders correctly", async () => {
      const filePath = resolve(FIXTURES_DIR, "valid-page.tsx");
      const page = await loadTsxPage({ filePath, pagesDir: FIXTURES_DIR });

      const Component = page.component;
      const element = <Component />;

      expect(element.type).toBe(Component);
    });

    it("should throw PageLoadError for missing frontmatter export", async () => {
      const filePath = resolve(FIXTURES_DIR, "missing-frontmatter.tsx");

      try {
        await loadTsxPage({ filePath, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(PageLoadError);
        expect((error as PageLoadError).filePath).toBe(filePath);
        expect((error as PageLoadError).reason).toBe(
          "Missing 'frontmatter' export. TSX pages must export a frontmatter object.",
        );
        expect((error as PageLoadError).message).toContain(filePath);
        expect((error as PageLoadError).message).toContain("frontmatter");
      }
    });

    it("should throw PageLoadError for frontmatter missing title", async () => {
      const filePath = resolve(
        FIXTURES_DIR,
        "invalid-frontmatter-missing-title.tsx",
      );

      try {
        await loadTsxPage({ filePath, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(PageLoadError);
        expect((error as PageLoadError).reason).toContain(
          "Invalid frontmatter",
        );
        expect((error as PageLoadError).reason).toContain("title");
      }
    });

    it("should throw PageLoadError for empty title in frontmatter", async () => {
      const filePath = resolve(
        FIXTURES_DIR,
        "invalid-frontmatter-empty-title.tsx",
      );

      try {
        await loadTsxPage({ filePath, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(PageLoadError);
        expect((error as PageLoadError).reason).toContain(
          "Invalid frontmatter",
        );
        expect((error as PageLoadError).reason).toContain(
          "Frontmatter title cannot be empty",
        );
      }
    });

    it("should throw PageLoadError for missing default export", async () => {
      const filePath = resolve(FIXTURES_DIR, "missing-default-export.tsx");

      try {
        await loadTsxPage({ filePath, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(PageLoadError);
        expect((error as PageLoadError).reason).toBe(
          "Missing default export. TSX pages must have a default export component.",
        );
      }
    });

    it("should throw PageLoadError for non-function default export", async () => {
      const filePath = resolve(FIXTURES_DIR, "non-function-default.tsx");

      try {
        await loadTsxPage({ filePath, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(PageLoadError);
        expect((error as PageLoadError).reason).toContain(
          "Default export must be a function",
        );
        expect((error as PageLoadError).reason).toContain("got string");
      }
    });

    it("should throw PageLoadError for non-existent file", async () => {
      const filePath = resolve(FIXTURES_DIR, "does-not-exist.tsx");

      try {
        await loadTsxPage({ filePath, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(PageLoadError);
        expect((error as PageLoadError).reason).toContain(
          "Failed to import module",
        );
        expect((error as PageLoadError).cause).toBeDefined();
      }
    });

    it("should include file path in error message", async () => {
      const filePath = resolve(FIXTURES_DIR, "missing-frontmatter.tsx");

      try {
        await loadTsxPage({ filePath, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain(filePath);
        expect((error as Error).message).toContain("Failed to load page");
      }
    });

    it("should throw PageLoadError for path traversal attempt", async () => {
      const filePath = "/etc/passwd";

      try {
        await loadTsxPage({ filePath, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(PageLoadError);
        expect((error as PageLoadError).reason).toContain(
          "Path is outside pages directory",
        );
      }
    });

    it("should throw PageLoadError for relative path", async () => {
      const filePath = "relative/path.tsx";

      try {
        await loadTsxPage({ filePath, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(PageLoadError);
        expect((error as PageLoadError).reason).toBe("Path must be absolute");
      }
    });
  });

  describe("PageLoadError", () => {
    it("should create error with file path and reason", () => {
      const error = new PageLoadError(
        "/app/pages/test.tsx",
        "Something went wrong",
      );

      expect(error.name).toBe("PageLoadError");
      expect(error.filePath).toBe("/app/pages/test.tsx");
      expect(error.reason).toBe("Something went wrong");
      expect(error.message).toBe(
        'Failed to load page "/app/pages/test.tsx": Something went wrong',
      );
    });

    it("should create error with cause and include cause message", () => {
      const cause = new Error("Original error");
      const error = new PageLoadError(
        "/app/pages/test.tsx",
        "Import failed",
        cause,
      );

      expect(error.cause).toBe(cause);
      expect(error.message).toContain("Original error");
    });

    it("should be instance of Error", () => {
      const error = new PageLoadError("/app/pages/test.tsx", "Test reason");
      expect(error).toBeInstanceOf(Error);
    });
  });
});
