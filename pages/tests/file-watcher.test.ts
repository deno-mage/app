/**
 * Tests for file-watcher module.
 *
 * @module
 */

import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import {
  classifyChange,
  createFileWatcher,
  type FileChange,
  requiresFullRebuild,
} from "../file-watcher.ts";

describe("classifyChange", () => {
  describe("UnoCSS config", () => {
    it("should classify uno.config.ts as config", () => {
      expect(classifyChange("uno.config.ts")).toBe("config");
    });
  });

  describe("public assets", () => {
    it("should classify files in public/ as public", () => {
      expect(classifyChange("public/styles.css")).toBe("public");
    });

    it("should classify nested files in public/ as public", () => {
      expect(classifyChange("public/images/logo.png")).toBe("public");
    });

    it("should classify deeply nested public files correctly", () => {
      expect(classifyChange("public/assets/fonts/inter.woff2")).toBe("public");
    });
  });

  describe("system files", () => {
    it("should classify _html.tsx as system", () => {
      expect(classifyChange("pages/_html.tsx")).toBe("system");
    });

    it("should classify _error.tsx as system", () => {
      expect(classifyChange("pages/_error.tsx")).toBe("system");
    });

    it("should classify _not-found.tsx as system", () => {
      expect(classifyChange("pages/_not-found.tsx")).toBe("system");
    });

    it("should classify nested _html.tsx as system", () => {
      // Note: _html.tsx should only be at root, but function classifies by filename
      expect(classifyChange("pages/docs/_html.tsx")).toBe("system");
    });
  });

  describe("layout files", () => {
    it("should classify root _layout.tsx as layout", () => {
      expect(classifyChange("pages/_layout.tsx")).toBe("layout");
    });

    it("should classify nested _layout.tsx as layout", () => {
      expect(classifyChange("pages/docs/_layout.tsx")).toBe("layout");
    });

    it("should classify deeply nested _layout.tsx as layout", () => {
      expect(classifyChange("pages/docs/api/v2/_layout.tsx")).toBe("layout");
    });
  });

  describe("page files", () => {
    it("should classify .tsx files as page", () => {
      expect(classifyChange("pages/index.tsx")).toBe("page");
    });

    it("should classify .md files as page", () => {
      expect(classifyChange("pages/about.md")).toBe("page");
    });

    it("should classify nested .tsx files as page", () => {
      expect(classifyChange("pages/docs/getting-started.tsx")).toBe("page");
    });

    it("should classify nested .md files as page", () => {
      expect(classifyChange("pages/blog/2024/post.md")).toBe("page");
    });
  });

  describe("edge cases", () => {
    it("should classify unknown root files as config", () => {
      expect(classifyChange("deno.json")).toBe("config");
    });

    it("should classify files outside pages/public as config", () => {
      expect(classifyChange("src/utils.ts")).toBe("config");
    });

    it("should classify non-tsx/md files in pages as config", () => {
      // JSON files in pages directory aren't pages
      expect(classifyChange("pages/data.json")).toBe("config");
    });
  });
});

describe("requiresFullRebuild", () => {
  it("should return true for layout changes", () => {
    const changes: FileChange[] = [
      {
        path: "/test/pages/_layout.tsx",
        relativePath: "pages/_layout.tsx",
        type: "layout",
        kind: "modify",
      },
    ];

    expect(requiresFullRebuild(changes)).toBe(true);
  });

  it("should return true for system file changes", () => {
    const changes: FileChange[] = [
      {
        path: "/test/pages/_html.tsx",
        relativePath: "pages/_html.tsx",
        type: "system",
        kind: "modify",
      },
    ];

    expect(requiresFullRebuild(changes)).toBe(true);
  });

  it("should return true for config changes", () => {
    const changes: FileChange[] = [
      {
        path: "/test/uno.config.ts",
        relativePath: "uno.config.ts",
        type: "config",
        kind: "modify",
      },
    ];

    expect(requiresFullRebuild(changes)).toBe(true);
  });

  it("should return false for page-only changes", () => {
    const changes: FileChange[] = [
      {
        path: "/test/pages/index.tsx",
        relativePath: "pages/index.tsx",
        type: "page",
        kind: "modify",
      },
    ];

    expect(requiresFullRebuild(changes)).toBe(false);
  });

  it("should return false for public asset changes", () => {
    const changes: FileChange[] = [
      {
        path: "/test/public/styles.css",
        relativePath: "public/styles.css",
        type: "public",
        kind: "modify",
      },
    ];

    expect(requiresFullRebuild(changes)).toBe(false);
  });

  it("should return true if any change requires full rebuild", () => {
    const changes: FileChange[] = [
      {
        path: "/test/pages/index.tsx",
        relativePath: "pages/index.tsx",
        type: "page",
        kind: "modify",
      },
      {
        path: "/test/pages/_layout.tsx",
        relativePath: "pages/_layout.tsx",
        type: "layout",
        kind: "modify",
      },
    ];

    expect(requiresFullRebuild(changes)).toBe(true);
  });

  it("should return false for empty changes", () => {
    expect(requiresFullRebuild([])).toBe(false);
  });

  it("should handle multiple page changes without triggering rebuild", () => {
    const changes: FileChange[] = [
      {
        path: "/test/pages/index.tsx",
        relativePath: "pages/index.tsx",
        type: "page",
        kind: "modify",
      },
      {
        path: "/test/pages/about.tsx",
        relativePath: "pages/about.tsx",
        type: "page",
        kind: "create",
      },
      {
        path: "/test/public/style.css",
        relativePath: "public/style.css",
        type: "public",
        kind: "modify",
      },
    ];

    expect(requiresFullRebuild(changes)).toBe(false);
  });
});

describe(
  "createFileWatcher",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    it("should return a cleanup function", async () => {
      const testDir = await Deno.makeTempDir();

      try {
        await Deno.mkdir(`${testDir}/pages`);
        await Deno.writeTextFile(`${testDir}/pages/index.tsx`, "test");

        const cleanup = createFileWatcher({
          rootDir: testDir,
          debounceMs: 10,
          onChange: () => {},
        });

        expect(typeof cleanup).toBe("function");
        cleanup();
      } finally {
        await Deno.remove(testDir, { recursive: true });
      }
    });

    it("should not throw when pages directory does not exist", () => {
      const cleanup = createFileWatcher({
        rootDir: "/non-existent-directory-test-12345",
        debounceMs: 10,
        onChange: () => {},
      });

      expect(typeof cleanup).toBe("function");
      cleanup();
    });

    it("should call cleanup.clear on debounce when stopping", async () => {
      const testDir = await Deno.makeTempDir();

      try {
        await Deno.mkdir(`${testDir}/pages`);

        let callCount = 0;
        const cleanup = createFileWatcher({
          rootDir: testDir,
          debounceMs: 1000, // Long debounce
          onChange: () => {
            callCount++;
          },
        });

        // Cleanup immediately - pending debounced calls should be cancelled
        cleanup();

        // Wait to ensure no callbacks fire
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(callCount).toBe(0);
      } finally {
        await Deno.remove(testDir, { recursive: true });
      }
    });
  },
);
