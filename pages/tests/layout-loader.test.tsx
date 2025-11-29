/**
 * Tests for layout component loader.
 *
 * @module
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { LayoutLoadError, loadLayouts } from "../layout-loader.ts";
import type { LayoutInfo } from "../types.ts";
import { resolve } from "@std/path";

const FIXTURES_DIR = resolve(import.meta.dirname!, "fixtures");

describe("Layout Loader", () => {
  describe("loadLayouts", () => {
    it("should load valid layout component", async () => {
      const layoutInfos: LayoutInfo[] = [
        {
          filePath: resolve(FIXTURES_DIR, "valid-layout.tsx"),
          directory: "",
          depth: 0,
        },
      ];

      const layouts = await loadLayouts({
        layoutInfos,
        pagesDir: FIXTURES_DIR,
      });

      expect(layouts).toHaveLength(1);
      expect(layouts[0].component).toBeDefined();
      expect(typeof layouts[0].component).toBe("function");
      expect(layouts[0].directory).toBe("");
      expect(layouts[0].depth).toBe(0);
    });

    it("should load multiple layouts in parallel", async () => {
      const layoutInfos: LayoutInfo[] = [
        {
          filePath: resolve(FIXTURES_DIR, "valid-layout.tsx"),
          directory: "",
          depth: 0,
        },
        {
          filePath: resolve(FIXTURES_DIR, "valid-layout.tsx"),
          directory: "docs",
          depth: 1,
        },
        {
          filePath: resolve(FIXTURES_DIR, "valid-layout.tsx"),
          directory: "docs/api",
          depth: 2,
        },
      ];

      const startTime = Date.now();
      const layouts = await loadLayouts({
        layoutInfos,
        pagesDir: FIXTURES_DIR,
      });
      const duration = Date.now() - startTime;

      expect(layouts).toHaveLength(3);
      expect(layouts[0].depth).toBe(0);
      expect(layouts[1].depth).toBe(1);
      expect(layouts[2].depth).toBe(2);

      // Should complete quickly since they load in parallel
      // If they were sequential, it would take much longer
      expect(duration).toBeLessThan(1000);
    });

    it("should maintain order of layouts", async () => {
      const layoutInfos: LayoutInfo[] = [
        {
          filePath: resolve(FIXTURES_DIR, "valid-layout.tsx"),
          directory: "",
          depth: 0,
        },
        {
          filePath: resolve(FIXTURES_DIR, "valid-layout.tsx"),
          directory: "docs",
          depth: 1,
        },
        {
          filePath: resolve(FIXTURES_DIR, "valid-layout.tsx"),
          directory: "docs/guides",
          depth: 2,
        },
      ];

      const layouts = await loadLayouts({
        layoutInfos,
        pagesDir: FIXTURES_DIR,
      });

      expect(layouts[0].directory).toBe("");
      expect(layouts[0].depth).toBe(0);
      expect(layouts[1].directory).toBe("docs");
      expect(layouts[1].depth).toBe(1);
      expect(layouts[2].directory).toBe("docs/guides");
      expect(layouts[2].depth).toBe(2);
    });

    it("should return loaded layout with correct structure", async () => {
      const layoutInfos: LayoutInfo[] = [
        {
          filePath: resolve(FIXTURES_DIR, "valid-layout.tsx"),
          directory: "blog",
          depth: 1,
        },
      ];

      const layouts = await loadLayouts({
        layoutInfos,
        pagesDir: FIXTURES_DIR,
      });
      const layout = layouts[0];

      expect(layout).toHaveProperty("component");
      expect(layout).toHaveProperty("directory");
      expect(layout).toHaveProperty("depth");
      expect(typeof layout.component).toBe("function");
      expect(layout.directory).toBe("blog");
      expect(layout.depth).toBe(1);
    });

    it("should handle empty layout array", async () => {
      const layouts = await loadLayouts({
        layoutInfos: [],
        pagesDir: FIXTURES_DIR,
      });
      expect(layouts).toHaveLength(0);
    });

    it("should throw LayoutLoadError for missing default export", async () => {
      const layoutInfos: LayoutInfo[] = [
        {
          filePath: resolve(FIXTURES_DIR, "missing-layout-default.tsx"),
          directory: "",
          depth: 0,
        },
      ];

      try {
        await loadLayouts({ layoutInfos, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(LayoutLoadError);
        expect((error as LayoutLoadError).message).toContain(
          "Missing default export. Layout files must have a default export component.",
        );
      }
    });

    it("should throw LayoutLoadError for non-function default export", async () => {
      const layoutInfos: LayoutInfo[] = [
        {
          filePath: resolve(FIXTURES_DIR, "invalid-layout-not-function.tsx"),
          directory: "",
          depth: 0,
        },
      ];

      try {
        await loadLayouts({ layoutInfos, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(LayoutLoadError);
        expect((error as LayoutLoadError).reason).toContain(
          "Default export must be a function",
        );
        expect((error as LayoutLoadError).reason).toContain("got object");
      }
    });

    it("should throw LayoutLoadError for non-existent file", async () => {
      const layoutInfos: LayoutInfo[] = [
        {
          filePath: resolve(FIXTURES_DIR, "does-not-exist.tsx"),
          directory: "",
          depth: 0,
        },
      ];

      try {
        await loadLayouts({ layoutInfos, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(LayoutLoadError);
        expect((error as LayoutLoadError).message).toContain(
          "Failed to import module",
        );
      }
    });

    it("should collect all errors when loading multiple layouts", async () => {
      const layoutInfos: LayoutInfo[] = [
        {
          filePath: resolve(FIXTURES_DIR, "valid-layout.tsx"),
          directory: "",
          depth: 0,
        },
        {
          filePath: resolve(FIXTURES_DIR, "invalid-layout-not-function.tsx"),
          directory: "docs",
          depth: 1,
        },
        {
          filePath: resolve(FIXTURES_DIR, "missing-layout-default.tsx"),
          directory: "docs/api",
          depth: 2,
        },
      ];

      try {
        await loadLayouts({ layoutInfos, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(LayoutLoadError);
        // Should collect multiple errors (Promise.allSettled behavior)
        const errorMessage = (error as LayoutLoadError).message;
        expect(errorMessage).toContain("Failed to load 2 layouts");
      }
    });

    it("should include file path in error message", async () => {
      const filePath = resolve(FIXTURES_DIR, "missing-layout-default.tsx");
      const layoutInfos: LayoutInfo[] = [
        {
          filePath,
          directory: "",
          depth: 0,
        },
      ];

      try {
        await loadLayouts({ layoutInfos, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain(filePath);
        expect((error as Error).message).toContain("Failed to load layout");
      }
    });

    it("should throw LayoutLoadError for path traversal attempt", async () => {
      const layoutInfos: LayoutInfo[] = [
        {
          filePath: "/etc/passwd",
          directory: "",
          depth: 0,
        },
      ];

      try {
        await loadLayouts({ layoutInfos, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(LayoutLoadError);
        expect((error as LayoutLoadError).reason).toContain(
          "Path is outside pages directory",
        );
      }
    });

    it("should throw LayoutLoadError for relative path", async () => {
      const layoutInfos: LayoutInfo[] = [
        {
          filePath: "relative/path/_layout.tsx",
          directory: "",
          depth: 0,
        },
      ];

      try {
        await loadLayouts({ layoutInfos, pagesDir: FIXTURES_DIR });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(LayoutLoadError);
        expect((error as LayoutLoadError).message).toContain(
          "Path must be absolute",
        );
      }
    });
  });

  describe("LayoutLoadError", () => {
    it("should create error with file path and reason", () => {
      const error = new LayoutLoadError(
        "/app/pages/_layout.tsx",
        "Something went wrong",
      );

      expect(error.name).toBe("LayoutLoadError");
      expect(error.filePath).toBe("/app/pages/_layout.tsx");
      expect(error.reason).toBe("Something went wrong");
      expect(error.message).toBe(
        'Failed to load layout "/app/pages/_layout.tsx": Something went wrong',
      );
    });

    it("should create error with cause and include cause message", () => {
      const cause = new Error("Original error");
      const error = new LayoutLoadError(
        "/app/pages/_layout.tsx",
        "Import failed",
        cause,
      );

      expect(error.cause).toBe(cause);
      expect(error.message).toContain("Original error");
    });

    it("should be instance of Error", () => {
      const error = new LayoutLoadError(
        "/app/pages/_layout.tsx",
        "Test reason",
      );
      expect(error).toBeInstanceOf(Error);
    });
  });
});
