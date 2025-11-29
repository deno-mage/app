/**
 * Tests for client bundle building.
 *
 * @module
 */

import { expect } from "@std/expect";
import { afterAll, describe, it } from "@std/testing/bdd";
import {
  buildBundle,
  generateEntryPoint,
  generateMarkdownEntryPoint,
  stopBundleBuilder,
} from "../bundle-builder.ts";
import { resolve } from "@std/path";

const FIXTURES_DIR = resolve(import.meta.dirname!, "fixtures");

describe(
  "Bundle Builder",
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    afterAll(async () => {
      await stopBundleBuilder();
    });

    describe("generateEntryPoint", () => {
      it("should generate entry point for page without layouts", () => {
        const code = generateEntryPoint("/app/pages/index.tsx", []);

        expect(code).toContain(
          'import PageComponent from "/app/pages/index.tsx"',
        );
        expect(code).toContain('import { hydrate } from "preact"');
        expect(code).toContain("import { ErrorBoundary }");
        expect(code).toContain("import { FrontmatterProvider }");
        expect(code).toContain("<PageComponent />");
        expect(code).toContain("hydrate(");
      });

      it("should generate entry point with single layout", () => {
        const code = generateEntryPoint("/app/pages/about.tsx", [
          "/app/pages/_layout.tsx",
        ]);

        expect(code).toContain('import Layout0 from "/app/pages/_layout.tsx"');
        expect(code).toContain("<Layout0>{<PageComponent />}</Layout0>");
      });

      it("should generate entry point with nested layouts", () => {
        const code = generateEntryPoint("/app/pages/docs/api.tsx", [
          "/app/pages/_layout.tsx",
          "/app/pages/docs/_layout.tsx",
        ]);

        expect(code).toContain('import Layout0 from "/app/pages/_layout.tsx"');
        expect(code).toContain(
          'import Layout1 from "/app/pages/docs/_layout.tsx"',
        );
        // Root layout wraps docs layout which wraps page
        expect(code).toContain(
          "<Layout0>{<Layout1>{<PageComponent />}</Layout1>}</Layout0>",
        );
      });

      it("should wrap content in FrontmatterProvider", () => {
        const code = generateEntryPoint("/app/pages/index.tsx", []);

        expect(code).toContain(
          "<FrontmatterProvider frontmatter={frontmatter}>",
        );
        expect(code).toContain("window.__PAGE_PROPS__?.frontmatter");
      });

      it("should wrap content in ErrorBoundary", () => {
        const code = generateEntryPoint("/app/pages/index.tsx", []);

        expect(code).toContain("<ErrorBoundary>");
      });

      it("should handle missing app root gracefully", () => {
        const code = generateEntryPoint("/app/pages/index.tsx", []);

        expect(code).toContain('document.getElementById("app")');
        expect(code).toContain("if (!appRoot)");
        expect(code).toContain("console.error");
      });
    });

    describe("generateMarkdownEntryPoint", () => {
      it("should generate entry point without page import", () => {
        const code = generateMarkdownEntryPoint([]);

        // Should NOT import a page component
        expect(code).not.toContain("import PageComponent");
        expect(code).toContain('import { hydrate } from "preact"');
        expect(code).toContain("import { ErrorBoundary }");
        expect(code).toContain("import { FrontmatterProvider }");
      });

      it("should capture and preserve markdown content", () => {
        const code = generateMarkdownEntryPoint([]);

        expect(code).toContain("const markdownContent = appRoot.innerHTML");
        expect(code).toContain("function StaticContent()");
        expect(code).toContain("dangerouslySetInnerHTML");
        expect(code).toContain("__html: markdownContent");
      });

      it("should use StaticContent component in composition", () => {
        const code = generateMarkdownEntryPoint([]);

        expect(code).toContain("<StaticContent />");
      });

      it("should generate entry point with layouts wrapping StaticContent", () => {
        const code = generateMarkdownEntryPoint([
          "/app/pages/_layout.tsx",
          "/app/pages/docs/_layout.tsx",
        ]);

        expect(code).toContain('import Layout0 from "/app/pages/_layout.tsx"');
        expect(code).toContain(
          'import Layout1 from "/app/pages/docs/_layout.tsx"',
        );
        expect(code).toContain(
          "<Layout0>{<Layout1>{<StaticContent />}</Layout1>}</Layout0>",
        );
      });

      it("should wrap content in FrontmatterProvider", () => {
        const code = generateMarkdownEntryPoint([]);

        expect(code).toContain(
          "<FrontmatterProvider frontmatter={frontmatter}>",
        );
        expect(code).toContain("window.__PAGE_PROPS__?.frontmatter");
      });
    });

    describe("buildBundle", () => {
      it("should build bundle for valid page", async () => {
        const pagePath = resolve(FIXTURES_DIR, "valid-page.tsx");

        const result = await buildBundle({
          pagePath,
          layoutPaths: [],
          rootDir: FIXTURES_DIR,
          pageId: "index",
        });

        expect(result.code).toBeDefined();
        expect(typeof result.code).toBe("string");
        expect(result.code.length).toBeGreaterThan(0);
        // Should be bundled ESM with Preact
        expect(result.code).toContain("getElementById");
      });

      it("should build bundle with layout", async () => {
        const pagePath = resolve(FIXTURES_DIR, "valid-page.tsx");
        const layoutPath = resolve(FIXTURES_DIR, "valid-layout.tsx");

        const result = await buildBundle({
          pagePath,
          layoutPaths: [layoutPath],
          rootDir: FIXTURES_DIR,
          pageId: "index",
        });

        expect(result.code).toBeDefined();
        expect(result.code.length).toBeGreaterThan(0);
      });

      it("should include inline sourcemap in development mode", async () => {
        const pagePath = resolve(FIXTURES_DIR, "valid-page.tsx");

        const result = await buildBundle({
          pagePath,
          layoutPaths: [],
          rootDir: FIXTURES_DIR,
          pageId: "index",
          production: false,
        });

        expect(result.code).toContain("//# sourceMappingURL=data:");
        expect(result.filename).toBeUndefined();
      });

      it("should minify and hash filename in production mode", async () => {
        const pagePath = resolve(FIXTURES_DIR, "valid-page.tsx");

        const result = await buildBundle({
          pagePath,
          layoutPaths: [],
          rootDir: FIXTURES_DIR,
          pageId: "about",
          production: true,
        });

        // Should not have sourcemap
        expect(result.code).not.toContain("//# sourceMappingURL");
        // Should have hashed filename
        expect(result.filename).toBeDefined();
        expect(result.filename).toMatch(/^about-[a-f0-9]{8}\.js$/);
      });

      it("should generate consistent hash for same content", async () => {
        const pagePath = resolve(FIXTURES_DIR, "valid-page.tsx");

        const result1 = await buildBundle({
          pagePath,
          layoutPaths: [],
          rootDir: FIXTURES_DIR,
          pageId: "test",
          production: true,
        });

        const result2 = await buildBundle({
          pagePath,
          layoutPaths: [],
          rootDir: FIXTURES_DIR,
          pageId: "test",
          production: true,
        });

        expect(result1.filename).toBe(result2.filename);
      });

      it("should build bundle for markdown page with isMarkdown flag", async () => {
        const layoutPath = resolve(FIXTURES_DIR, "valid-layout.tsx");

        const result = await buildBundle({
          pagePath: "/does/not/matter.md",
          layoutPaths: [layoutPath],
          rootDir: FIXTURES_DIR,
          pageId: "docs-intro",
          isMarkdown: true,
        });

        expect(result.code).toBeDefined();
        expect(result.code.length).toBeGreaterThan(0);
        // Should have StaticContent for markdown preservation
        expect(result.code).toContain("innerHTML");
      });

      it("should build production markdown bundle with hash", async () => {
        const layoutPath = resolve(FIXTURES_DIR, "valid-layout.tsx");

        const result = await buildBundle({
          pagePath: "/does/not/matter.md",
          layoutPaths: [layoutPath],
          rootDir: FIXTURES_DIR,
          pageId: "docs-intro",
          isMarkdown: true,
          production: true,
        });

        expect(result.filename).toBeDefined();
        expect(result.filename).toMatch(/^docs-intro-[a-f0-9]{8}\.js$/);
      });
    });
  },
);
