import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { renderJsxLayout } from "../jsx-renderer.ts";
import type { TemplateData } from "../template.ts";
import { join } from "@std/path";

const fixturesDir = join(import.meta.dirname!, "fixtures", "layouts");

describe("markdown-app - jsx-renderer", () => {
  describe("renderJsxLayout", () => {
    it("should render a valid JSX layout to HTML", async () => {
      const layoutPath = join(fixturesDir, "_layout-test.tsx");

      const templateData: TemplateData = {
        title: "Test Page",
        content: "<p>Hello World</p>",
        navigation: {},
        basePath: "",
      };

      const html = await renderJsxLayout(layoutPath, templateData);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<title>Test Page</title>");
      expect(html).toContain("<h1>Test Page</h1>");
      expect(html).toContain("<p>Hello World</p>");
    });

    it("should throw error if Layout export is missing", async () => {
      const layoutPath = join(fixturesDir, "_layout-bad.tsx");

      const templateData: TemplateData = {
        title: "Test",
        content: "<p>Content</p>",
        navigation: {},
        basePath: "",
      };

      await expect(renderJsxLayout(layoutPath, templateData)).rejects.toThrow(
        'must export a "Layout" component',
      );
    });

    it("should handle file:// URLs correctly", async () => {
      const layoutPath = join(fixturesDir, "_layout-fileurl.tsx");
      const fileUrl = `file://${layoutPath}`;

      const templateData: TemplateData = {
        title: "File URL Test",
        content: "",
        navigation: {},
        basePath: "",
      };

      const html = await renderJsxLayout(fileUrl, templateData);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<title>File URL Test</title>");
    });

    it("should pass navigation data to layout", async () => {
      const layoutPath = join(fixturesDir, "_layout-nav.tsx");

      const templateData: TemplateData = {
        title: "Nav Test",
        content: "<p>Content</p>",
        navigation: {
          default: [
            {
              title: "Section 1",
              order: 1,
              items: [],
            },
            {
              title: "Section 2",
              order: 2,
              items: [],
            },
          ],
        },
        basePath: "",
      };

      const html = await renderJsxLayout(layoutPath, templateData);

      expect(html).toContain("2 sections");
    });

    it("should pass basePath to layout", async () => {
      const layoutPath = join(fixturesDir, "_layout-basepath.tsx");

      const templateData: TemplateData = {
        title: "Base Path Test",
        content: "",
        navigation: {},
        basePath: "/docs",
      };

      const html = await renderJsxLayout(layoutPath, templateData);

      expect(html).toContain('href="/docs/home"');
    });
  });
});
