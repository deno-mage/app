/**
 * Tests for directory scanner functions.
 *
 * @module
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { join } from "@std/path";
import {
  getLayoutsForPage,
  getPageDirectory,
  scanPages,
  scanSystemFiles,
} from "../scanner.ts";

describe("scanner", () => {
  describe("scanSystemFiles", () => {
    it("should discover _html.tsx at root", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(
          join(tempDir, "_html.tsx"),
          "export default function Html() {}",
        );

        const result = await scanSystemFiles(tempDir);

        expect(result.htmlTemplate).toBe(join(tempDir, "_html.tsx"));
        expect(result.layouts).toEqual([]);
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should discover _not-found.tsx at root", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(
          join(tempDir, "_not-found.tsx"),
          "export default function NotFound() {}",
        );

        const result = await scanSystemFiles(tempDir);

        expect(result.notFound).toBe(join(tempDir, "_not-found.tsx"));
        expect(result.layouts).toEqual([]);
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should discover _error.tsx at root", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(
          join(tempDir, "_error.tsx"),
          "export default function Error() {}",
        );

        const result = await scanSystemFiles(tempDir);

        expect(result.error).toBe(join(tempDir, "_error.tsx"));
        expect(result.layouts).toEqual([]);
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should discover _layout.tsx at root", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(
          join(tempDir, "_layout.tsx"),
          "export default function Layout() {}",
        );

        const result = await scanSystemFiles(tempDir);

        expect(result.layouts).toHaveLength(1);
        expect(result.layouts[0].filePath).toBe(join(tempDir, "_layout.tsx"));
        expect(result.layouts[0].directory).toBe("");
        expect(result.layouts[0].depth).toBe(0);
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should discover _layout.tsx in nested directory", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.mkdir(join(tempDir, "docs"), { recursive: true });
        await Deno.writeTextFile(
          join(tempDir, "docs", "_layout.tsx"),
          "export default function Layout() {}",
        );

        const result = await scanSystemFiles(tempDir);

        expect(result.layouts).toHaveLength(1);
        expect(result.layouts[0].filePath).toBe(
          join(tempDir, "docs", "_layout.tsx"),
        );
        expect(result.layouts[0].directory).toBe("docs");
        expect(result.layouts[0].depth).toBe(1);
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should discover multiple layouts and sort by depth", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(
          join(tempDir, "_layout.tsx"),
          "export default function Layout() {}",
        );
        await Deno.mkdir(join(tempDir, "docs"), { recursive: true });
        await Deno.writeTextFile(
          join(tempDir, "docs", "_layout.tsx"),
          "export default function Layout() {}",
        );
        await Deno.mkdir(join(tempDir, "docs", "api"), { recursive: true });
        await Deno.writeTextFile(
          join(tempDir, "docs", "api", "_layout.tsx"),
          "export default function Layout() {}",
        );

        const result = await scanSystemFiles(tempDir);

        expect(result.layouts).toHaveLength(3);
        expect(result.layouts[0].directory).toBe("");
        expect(result.layouts[0].depth).toBe(0);
        expect(result.layouts[1].directory).toBe("docs");
        expect(result.layouts[1].depth).toBe(1);
        expect(result.layouts[2].directory).toBe("docs/api");
        expect(result.layouts[2].depth).toBe(2);
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should discover all system files together", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(
          join(tempDir, "_html.tsx"),
          "export default function Html() {}",
        );
        await Deno.writeTextFile(
          join(tempDir, "_not-found.tsx"),
          "export default function NotFound() {}",
        );
        await Deno.writeTextFile(
          join(tempDir, "_error.tsx"),
          "export default function Error() {}",
        );
        await Deno.writeTextFile(
          join(tempDir, "_layout.tsx"),
          "export default function Layout() {}",
        );

        const result = await scanSystemFiles(tempDir);

        expect(result.htmlTemplate).toBe(join(tempDir, "_html.tsx"));
        expect(result.notFound).toBe(join(tempDir, "_not-found.tsx"));
        expect(result.error).toBe(join(tempDir, "_error.tsx"));
        expect(result.layouts).toHaveLength(1);
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should return empty arrays when directory does not exist", async () => {
      const result = await scanSystemFiles("/nonexistent/directory");

      expect(result.layouts).toEqual([]);
      expect(result.htmlTemplate).toBeUndefined();
      expect(result.notFound).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it("should ignore non-tsx files", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(join(tempDir, "_html.ts"), "// TypeScript");
        await Deno.writeTextFile(join(tempDir, "_layout.jsx"), "// JSX");
        await Deno.writeTextFile(join(tempDir, "_not-found.md"), "# Markdown");

        const result = await scanSystemFiles(tempDir);

        expect(result.htmlTemplate).toBeUndefined();
        expect(result.notFound).toBeUndefined();
        expect(result.layouts).toEqual([]);
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should only find root-level system files at root", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.mkdir(join(tempDir, "docs"), { recursive: true });
        await Deno.writeTextFile(
          join(tempDir, "docs", "_html.tsx"),
          "export default function Html() {}",
        );
        await Deno.writeTextFile(
          join(tempDir, "docs", "_not-found.tsx"),
          "export default function NotFound() {}",
        );

        const result = await scanSystemFiles(tempDir);

        expect(result.htmlTemplate).toBeUndefined();
        expect(result.notFound).toBeUndefined();
        expect(result.layouts).toEqual([]);
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });

  describe("scanPages", () => {
    it("should discover markdown files", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(join(tempDir, "index.md"), "# Home");

        const result = await scanPages(tempDir);

        expect(result).toHaveLength(1);
        expect(result[0].filePath).toBe(join(tempDir, "index.md"));
        expect(result[0].urlPath).toBe("/");
        expect(result[0].type).toBe("markdown");
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should discover tsx files", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(
          join(tempDir, "about.tsx"),
          "export default function About() {}",
        );

        const result = await scanPages(tempDir);

        expect(result).toHaveLength(1);
        expect(result[0].filePath).toBe(join(tempDir, "about.tsx"));
        expect(result[0].urlPath).toBe("/about");
        expect(result[0].type).toBe("tsx");
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should exclude files starting with underscore", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(join(tempDir, "_layout.tsx"), "Layout");
        await Deno.writeTextFile(join(tempDir, "_html.tsx"), "HTML");
        await Deno.writeTextFile(join(tempDir, "page.md"), "# Page");

        const result = await scanPages(tempDir);

        expect(result).toHaveLength(1);
        expect(result[0].urlPath).toBe("/page");
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should exclude files in directories starting with underscore", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.mkdir(join(tempDir, "_components"), { recursive: true });
        await Deno.writeTextFile(
          join(tempDir, "_components", "button.tsx"),
          "Button",
        );
        await Deno.writeTextFile(join(tempDir, "page.md"), "# Page");

        const result = await scanPages(tempDir);

        expect(result).toHaveLength(1);
        expect(result[0].urlPath).toBe("/page");
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should discover nested pages", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.mkdir(join(tempDir, "docs", "guides"), { recursive: true });
        await Deno.writeTextFile(
          join(tempDir, "docs", "guides", "getting-started.md"),
          "# Getting Started",
        );

        const result = await scanPages(tempDir);

        expect(result).toHaveLength(1);
        expect(result[0].urlPath).toBe("/docs/guides/getting-started");
        expect(result[0].type).toBe("markdown");
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should convert index.md to root path", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(join(tempDir, "index.md"), "# Home");

        const result = await scanPages(tempDir);

        expect(result).toHaveLength(1);
        expect(result[0].urlPath).toBe("/");
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should convert nested index to parent path", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.mkdir(join(tempDir, "docs"), { recursive: true });
        await Deno.writeTextFile(
          join(tempDir, "docs", "index.md"),
          "# Docs Home",
        );

        const result = await scanPages(tempDir);

        expect(result).toHaveLength(1);
        expect(result[0].urlPath).toBe("/docs");
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should discover multiple pages", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(join(tempDir, "index.md"), "# Home");
        await Deno.writeTextFile(join(tempDir, "about.tsx"), "About");
        await Deno.mkdir(join(tempDir, "docs"), { recursive: true });
        await Deno.writeTextFile(join(tempDir, "docs", "guide.md"), "Guide");

        const result = await scanPages(tempDir);

        expect(result).toHaveLength(3);
        const paths = result.map((p) => p.urlPath).sort();
        expect(paths).toEqual(["/", "/about", "/docs/guide"]);
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should return empty array when directory does not exist", async () => {
      const result = await scanPages("/nonexistent/directory");
      expect(result).toEqual([]);
    });

    it("should ignore non-md and non-tsx files", async () => {
      const tempDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(join(tempDir, "page.html"), "HTML");
        await Deno.writeTextFile(join(tempDir, "script.js"), "JS");
        await Deno.writeTextFile(join(tempDir, "style.css"), "CSS");
        await Deno.writeTextFile(join(tempDir, "valid.md"), "# Valid");

        const result = await scanPages(tempDir);

        expect(result).toHaveLength(1);
        expect(result[0].urlPath).toBe("/valid");
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });

  describe("getLayoutsForPage", () => {
    it("should return empty array when no layouts exist", () => {
      const result = getLayoutsForPage("docs/api", []);
      expect(result).toEqual([]);
    });

    it("should return root layout for root page", () => {
      const layouts = [
        { filePath: "/root/_layout.tsx", directory: "", depth: 0 },
      ];

      const result = getLayoutsForPage("", layouts);

      expect(result).toHaveLength(1);
      expect(result[0].directory).toBe("");
    });

    it("should return root layout for top-level page", () => {
      const layouts = [
        { filePath: "/root/_layout.tsx", directory: "", depth: 0 },
        { filePath: "/root/docs/_layout.tsx", directory: "docs", depth: 1 },
      ];

      const result = getLayoutsForPage("", layouts);

      expect(result).toHaveLength(1);
      expect(result[0].directory).toBe("");
    });

    it("should return layouts from root to page directory", () => {
      const layouts = [
        { filePath: "/root/_layout.tsx", directory: "", depth: 0 },
        { filePath: "/root/docs/_layout.tsx", directory: "docs", depth: 1 },
        {
          filePath: "/root/docs/api/_layout.tsx",
          directory: "docs/api",
          depth: 2,
        },
      ];

      const result = getLayoutsForPage("docs/api", layouts);

      expect(result).toHaveLength(3);
      expect(result[0].directory).toBe("");
      expect(result[1].directory).toBe("docs");
      expect(result[2].directory).toBe("docs/api");
    });

    it("should skip missing intermediate layouts", () => {
      const layouts = [
        { filePath: "/root/_layout.tsx", directory: "", depth: 0 },
        {
          filePath: "/root/docs/api/_layout.tsx",
          directory: "docs/api",
          depth: 2,
        },
      ];

      const result = getLayoutsForPage("docs/api", layouts);

      expect(result).toHaveLength(2);
      expect(result[0].directory).toBe("");
      expect(result[1].directory).toBe("docs/api");
    });

    it("should not include layouts deeper than page directory", () => {
      const layouts = [
        { filePath: "/root/_layout.tsx", directory: "", depth: 0 },
        { filePath: "/root/docs/_layout.tsx", directory: "docs", depth: 1 },
        {
          filePath: "/root/docs/api/_layout.tsx",
          directory: "docs/api",
          depth: 2,
        },
      ];

      const result = getLayoutsForPage("docs", layouts);

      expect(result).toHaveLength(2);
      expect(result[0].directory).toBe("");
      expect(result[1].directory).toBe("docs");
    });

    it("should handle page directory with leading slash", () => {
      const layouts = [
        { filePath: "/root/_layout.tsx", directory: "", depth: 0 },
        { filePath: "/root/docs/_layout.tsx", directory: "docs", depth: 1 },
      ];

      const result = getLayoutsForPage("/docs", layouts);

      expect(result).toHaveLength(2);
      expect(result[0].directory).toBe("");
      expect(result[1].directory).toBe("docs");
    });

    it("should handle page directory with trailing slash", () => {
      const layouts = [
        { filePath: "/root/_layout.tsx", directory: "", depth: 0 },
        { filePath: "/root/docs/_layout.tsx", directory: "docs", depth: 1 },
      ];

      const result = getLayoutsForPage("docs/", layouts);

      expect(result).toHaveLength(2);
      expect(result[0].directory).toBe("");
      expect(result[1].directory).toBe("docs");
    });

    it("should handle deeply nested page directories", () => {
      const layouts = [
        { filePath: "/root/_layout.tsx", directory: "", depth: 0 },
        { filePath: "/root/a/_layout.tsx", directory: "a", depth: 1 },
        { filePath: "/root/a/b/_layout.tsx", directory: "a/b", depth: 2 },
        {
          filePath: "/root/a/b/c/_layout.tsx",
          directory: "a/b/c",
          depth: 3,
        },
      ];

      const result = getLayoutsForPage("a/b/c", layouts);

      expect(result).toHaveLength(4);
      expect(result[0].directory).toBe("");
      expect(result[1].directory).toBe("a");
      expect(result[2].directory).toBe("a/b");
      expect(result[3].directory).toBe("a/b/c");
    });

    it("should not include sibling layouts", () => {
      const layouts = [
        { filePath: "/root/_layout.tsx", directory: "", depth: 0 },
        { filePath: "/root/docs/_layout.tsx", directory: "docs", depth: 1 },
        { filePath: "/root/blog/_layout.tsx", directory: "blog", depth: 1 },
      ];

      const result = getLayoutsForPage("docs", layouts);

      expect(result).toHaveLength(2);
      expect(result[0].directory).toBe("");
      expect(result[1].directory).toBe("docs");
    });
  });

  describe("getPageDirectory", () => {
    it("should return empty string for root path", () => {
      expect(getPageDirectory("/")).toBe("");
    });

    it("should return empty string for top-level page", () => {
      expect(getPageDirectory("/about")).toBe("");
    });

    it("should return parent directory for nested page", () => {
      expect(getPageDirectory("/docs/guide")).toBe("docs");
    });

    it("should return parent path for deeply nested page", () => {
      expect(getPageDirectory("/docs/api/request")).toBe("docs/api");
    });

    it("should handle path without leading slash", () => {
      expect(getPageDirectory("docs/guide")).toBe("docs");
    });

    it("should handle deeply nested paths", () => {
      expect(getPageDirectory("/a/b/c/d/page")).toBe("a/b/c/d");
    });

    it("should handle single segment after root", () => {
      expect(getPageDirectory("/docs")).toBe("");
    });
  });
});
