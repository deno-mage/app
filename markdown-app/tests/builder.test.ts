import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { build, type BuildOptions } from "../builder.ts";
import { join } from "@std/path";
import { exists } from "@std/fs";

describe("markdown-app - builder", () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create unique temp directory for each test
    tempDir = await Deno.makeTempDir({ prefix: "markdown-app-test-" });
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await Deno.remove(tempDir, { recursive: true });
    } catch {
      // Ignore errors during cleanup
    }
  });

  describe("build", () => {
    it("should build markdown files to static HTML", async () => {
      const sourceDir = join(tempDir, "source");
      const outputDir = join(tempDir, "output");
      const layoutDir = join(tempDir, "layouts");

      // Create directories
      await Deno.mkdir(sourceDir, { recursive: true });
      await Deno.mkdir(layoutDir, { recursive: true });

      // Create layout
      await Deno.writeTextFile(
        join(layoutDir, "_layout-docs.html"),
        `<!DOCTYPE html><html><head><title>{{title}}</title></head><body>{{content}}</body></html>`,
      );

      // Create markdown file
      await Deno.writeTextFile(
        join(sourceDir, "test.md"),
        `---
title: Test Page
slug: test
layout: docs
---

# Hello World`,
      );

      const options: BuildOptions = {
        sourceDir,
        outputDir,
        layoutDir,
        basePath: "/",
        dev: false,
      };

      await build(options);

      // Verify output file exists
      const outputFile = join(outputDir, "test.html");
      expect(await exists(outputFile)).toBe(true);

      // Verify content
      const content = await Deno.readTextFile(outputFile);
      expect(content).toContain("<title>Test Page</title>");
      expect(content).toContain("<h1");
      expect(content).toContain("Hello World");
    });

    it("should handle nested slugs", async () => {
      const sourceDir = join(tempDir, "source");
      const outputDir = join(tempDir, "output");
      const layoutDir = join(tempDir, "layouts");

      await Deno.mkdir(sourceDir, { recursive: true });
      await Deno.mkdir(layoutDir, { recursive: true });

      await Deno.writeTextFile(
        join(layoutDir, "_layout-docs.html"),
        `<html><body>{{content}}</body></html>`,
      );

      await Deno.writeTextFile(
        join(sourceDir, "guide.md"),
        `---
title: Guide
slug: api/router
layout: docs
---

Content`,
      );

      const options: BuildOptions = {
        sourceDir,
        outputDir,
        layoutDir,
        basePath: "/",
        dev: false,
      };

      await build(options);

      const outputFile = join(outputDir, "api/router.html");
      expect(await exists(outputFile)).toBe(true);
    });

    it("should generate navigation across all pages", async () => {
      const sourceDir = join(tempDir, "source");
      const outputDir = join(tempDir, "output");
      const layoutDir = join(tempDir, "layouts");

      await Deno.mkdir(sourceDir, { recursive: true });
      await Deno.mkdir(layoutDir, { recursive: true });

      await Deno.writeTextFile(
        join(layoutDir, "_layout-docs.html"),
        `<html><body><nav>{{navigation}}</nav>{{content}}</body></html>`,
      );

      await Deno.writeTextFile(
        join(sourceDir, "page1.md"),
        `---
title: Page 1
slug: page1
layout: docs
nav: Page 1
nav-order: 1
---

Content 1`,
      );

      await Deno.writeTextFile(
        join(sourceDir, "page2.md"),
        `---
title: Page 2
slug: page2
layout: docs
nav: Page 2
nav-order: 2
---

Content 2`,
      );

      const options: BuildOptions = {
        sourceDir,
        outputDir,
        layoutDir,
        basePath: "/",
        dev: false,
      };

      await build(options);

      // Check page1 has navigation to both pages
      const page1Content = await Deno.readTextFile(
        join(outputDir, "page1.html"),
      );
      expect(page1Content).toContain('href="/page1"');
      expect(page1Content).toContain('href="/page2"');
      expect(page1Content).toContain('data-current="true"');

      // Check page2 has navigation to both pages
      const page2Content = await Deno.readTextFile(
        join(outputDir, "page2.html"),
      );
      expect(page2Content).toContain('href="/page1"');
      expect(page2Content).toContain('href="/page2"');
    });

    it("should normalize basePath for templates", async () => {
      const sourceDir = join(tempDir, "source");
      const outputDir = join(tempDir, "output");
      const layoutDir = join(tempDir, "layouts");

      await Deno.mkdir(sourceDir, { recursive: true });
      await Deno.mkdir(layoutDir, { recursive: true });

      await Deno.writeTextFile(
        join(layoutDir, "_layout-docs.html"),
        `<html><head><link rel="stylesheet" href="{{basePath}}/gfm.css"></head><body>{{content}}</body></html>`,
      );

      await Deno.writeTextFile(
        join(sourceDir, "test.md"),
        `---
title: Test
slug: test
layout: docs
---

Content`,
      );

      const options: BuildOptions = {
        sourceDir,
        outputDir,
        layoutDir,
        basePath: "/", // Should be normalized to empty string
        dev: false,
      };

      await build(options);

      const content = await Deno.readTextFile(join(outputDir, "test.html"));
      expect(content).toContain('href="/gfm.css"');
      expect(content).not.toContain('href="//gfm.css"');
    });

    it("should inject hot reload script in dev mode", async () => {
      const sourceDir = join(tempDir, "source");
      const outputDir = join(tempDir, "output");
      const layoutDir = join(tempDir, "layouts");

      await Deno.mkdir(sourceDir, { recursive: true });
      await Deno.mkdir(layoutDir, { recursive: true });

      await Deno.writeTextFile(
        join(layoutDir, "_layout-docs.html"),
        `<html><body>{{content}}</body></html>`,
      );

      await Deno.writeTextFile(
        join(sourceDir, "test.md"),
        `---
title: Test
slug: test
layout: docs
---

Content`,
      );

      const options: BuildOptions = {
        sourceDir,
        outputDir,
        layoutDir,
        basePath: "/",
        dev: true,
      };

      await build(options);

      const content = await Deno.readTextFile(join(outputDir, "test.html"));
      expect(content).toContain("__hot-reload");
      expect(content).toContain("WebSocket");
      expect(content).toContain("<script>");
    });

    it("should not inject hot reload script in production mode", async () => {
      const sourceDir = join(tempDir, "source");
      const outputDir = join(tempDir, "output");
      const layoutDir = join(tempDir, "layouts");

      await Deno.mkdir(sourceDir, { recursive: true });
      await Deno.mkdir(layoutDir, { recursive: true });

      await Deno.writeTextFile(
        join(layoutDir, "_layout-docs.html"),
        `<html><body>{{content}}</body></html>`,
      );

      await Deno.writeTextFile(
        join(sourceDir, "test.md"),
        `---
title: Test
slug: test
layout: docs
---

Content`,
      );

      const options: BuildOptions = {
        sourceDir,
        outputDir,
        layoutDir,
        basePath: "/",
        dev: false,
      };

      await build(options);

      const content = await Deno.readTextFile(join(outputDir, "test.html"));
      expect(content).not.toContain("__hot-reload");
      expect(content).not.toContain("WebSocket");
    });

    it("should write GFM CSS to output directory", async () => {
      const sourceDir = join(tempDir, "source");
      const outputDir = join(tempDir, "output");
      const layoutDir = join(tempDir, "layouts");

      await Deno.mkdir(sourceDir, { recursive: true });
      await Deno.mkdir(layoutDir, { recursive: true });

      await Deno.writeTextFile(
        join(layoutDir, "_layout-docs.html"),
        `<html><body>{{content}}</body></html>`,
      );

      await Deno.writeTextFile(
        join(sourceDir, "test.md"),
        `---
title: Test
slug: test
layout: docs
---

Content`,
      );

      const options: BuildOptions = {
        sourceDir,
        outputDir,
        layoutDir,
        basePath: "/",
        dev: false,
      };

      await build(options);

      const cssFile = join(outputDir, "gfm.css");
      expect(await exists(cssFile)).toBe(true);

      const css = await Deno.readTextFile(cssFile);
      expect(css.length).toBeGreaterThan(0);
    });

    it("should handle index/root slug", async () => {
      const sourceDir = join(tempDir, "source");
      const outputDir = join(tempDir, "output");
      const layoutDir = join(tempDir, "layouts");

      await Deno.mkdir(sourceDir, { recursive: true });
      await Deno.mkdir(layoutDir, { recursive: true });

      await Deno.writeTextFile(
        join(layoutDir, "_layout-docs.html"),
        `<html><body>{{content}}</body></html>`,
      );

      await Deno.writeTextFile(
        join(sourceDir, "index.md"),
        `---
title: Home
slug: index
layout: docs
---

Home page`,
      );

      const options: BuildOptions = {
        sourceDir,
        outputDir,
        layoutDir,
        basePath: "/",
        dev: false,
      };

      await build(options);

      const indexFile = join(outputDir, "index.html");
      expect(await exists(indexFile)).toBe(true);

      const content = await Deno.readTextFile(indexFile);
      expect(content).toContain("Home page");
    });

    it("should throw error when layout file not found", async () => {
      const sourceDir = join(tempDir, "source");
      const outputDir = join(tempDir, "output");
      const layoutDir = join(tempDir, "layouts");

      await Deno.mkdir(sourceDir, { recursive: true });
      await Deno.mkdir(layoutDir, { recursive: true });

      // No layout file created

      await Deno.writeTextFile(
        join(sourceDir, "test.md"),
        `---
title: Test
slug: test
layout: nonexistent
---

Content`,
      );

      const options: BuildOptions = {
        sourceDir,
        outputDir,
        layoutDir,
        basePath: "/",
        dev: false,
      };

      await expect(build(options)).rejects.toThrow("Layout file not found");
    });

    it("should handle empty source directory gracefully", async () => {
      const sourceDir = join(tempDir, "source");
      const outputDir = join(tempDir, "output");
      const layoutDir = join(tempDir, "layouts");

      await Deno.mkdir(sourceDir, { recursive: true });
      await Deno.mkdir(layoutDir, { recursive: true });

      const options: BuildOptions = {
        sourceDir,
        outputDir,
        layoutDir,
        basePath: "/",
        dev: false,
      };

      // Should not throw, just log warning
      await build(options);

      // Output directory may not even be created if no files
      // Just verify it doesn't error
    });

    it("should find markdown files recursively", async () => {
      const sourceDir = join(tempDir, "source");
      const outputDir = join(tempDir, "output");
      const layoutDir = join(tempDir, "layouts");

      await Deno.mkdir(join(sourceDir, "nested"), { recursive: true });
      await Deno.mkdir(layoutDir, { recursive: true });

      await Deno.writeTextFile(
        join(layoutDir, "_layout-docs.html"),
        `<html><body>{{content}}</body></html>`,
      );

      await Deno.writeTextFile(
        join(sourceDir, "root.md"),
        `---
title: Root
slug: root
layout: docs
---

Root content`,
      );

      await Deno.writeTextFile(
        join(sourceDir, "nested", "nested.md"),
        `---
title: Nested
slug: nested
layout: docs
---

Nested content`,
      );

      const options: BuildOptions = {
        sourceDir,
        outputDir,
        layoutDir,
        basePath: "/",
        dev: false,
      };

      await build(options);

      expect(await exists(join(outputDir, "root.html"))).toBe(true);
      expect(await exists(join(outputDir, "nested.html"))).toBe(true);
    });

    it("should handle basePath in navigation URLs", async () => {
      const sourceDir = join(tempDir, "source");
      const outputDir = join(tempDir, "output");
      const layoutDir = join(tempDir, "layouts");

      await Deno.mkdir(sourceDir, { recursive: true });
      await Deno.mkdir(layoutDir, { recursive: true });

      await Deno.writeTextFile(
        join(layoutDir, "_layout-docs.html"),
        `<html><body><nav>{{navigation}}</nav></body></html>`,
      );

      await Deno.writeTextFile(
        join(sourceDir, "test.md"),
        `---
title: Test
slug: test
layout: docs
nav: Test
nav-order: 1
---

Content`,
      );

      const options: BuildOptions = {
        sourceDir,
        outputDir,
        layoutDir,
        basePath: "/docs",
        dev: false,
      };

      await build(options);

      const content = await Deno.readTextFile(join(outputDir, "test.html"));
      expect(content).toContain('href="/docs/test"');
    });

    it("should inject hot reload script before closing body tag", async () => {
      const sourceDir = join(tempDir, "source");
      const outputDir = join(tempDir, "output");
      const layoutDir = join(tempDir, "layouts");

      await Deno.mkdir(sourceDir, { recursive: true });
      await Deno.mkdir(layoutDir, { recursive: true });

      await Deno.writeTextFile(
        join(layoutDir, "_layout-docs.html"),
        `<html><head><title>{{title}}</title></head><body><h1>Content</h1></body></html>`,
      );

      await Deno.writeTextFile(
        join(sourceDir, "test.md"),
        `---
title: Test
slug: test
layout: docs
---

Content`,
      );

      const options: BuildOptions = {
        sourceDir,
        outputDir,
        layoutDir,
        basePath: "/",
        dev: true,
      };

      await build(options);

      const content = await Deno.readTextFile(join(outputDir, "test.html"));

      // Script should be before </body>
      const scriptIndex = content.indexOf("<script>");
      const bodyCloseIndex = content.indexOf("</body>");
      expect(scriptIndex).toBeLessThan(bodyCloseIndex);
    });

    it("should handle layout without body tag for hot reload", async () => {
      const sourceDir = join(tempDir, "source");
      const outputDir = join(tempDir, "output");
      const layoutDir = join(tempDir, "layouts");

      await Deno.mkdir(sourceDir, { recursive: true });
      await Deno.mkdir(layoutDir, { recursive: true });

      await Deno.writeTextFile(
        join(layoutDir, "_layout-docs.html"),
        `<html><head><title>{{title}}</title></head>{{content}}`,
      );

      await Deno.writeTextFile(
        join(sourceDir, "test.md"),
        `---
title: Test
slug: test
layout: docs
---

Content`,
      );

      const options: BuildOptions = {
        sourceDir,
        outputDir,
        layoutDir,
        basePath: "/",
        dev: true,
      };

      await build(options);

      const content = await Deno.readTextFile(join(outputDir, "test.html"));

      // Script should be appended at the end
      expect(content).toContain("<script>");
      expect(content).toContain("__hot-reload");
    });
  });
});
