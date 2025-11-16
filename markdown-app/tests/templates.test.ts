import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { renderJsxLayout } from "../jsx-renderer.ts";
import type { TemplateData } from "../template.ts";
import { join } from "@std/path";

const fixturesDir = join(import.meta.dirname!, "fixtures", "layouts");

describe("templates - basic rendering", () => {
  it("should render JSX layout to HTML", async () => {
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
});

describe("templates - data passing", () => {
  it("should receive frontmatter data (title)", async () => {
    const layoutPath = join(fixturesDir, "_layout-test.tsx");

    const templateData: TemplateData = {
      title: "Custom Title",
      content: "<p>Content</p>",
      navigation: {},
      basePath: "",
    };

    const html = await renderJsxLayout(layoutPath, templateData);

    expect(html).toContain("<title>Custom Title</title>");
    expect(html).toContain("<h1>Custom Title</h1>");
  });

  it("should receive markdown content", async () => {
    const layoutPath = join(fixturesDir, "_layout-test.tsx");

    const templateData: TemplateData = {
      title: "Test",
      content: "<h2>Subheading</h2><p>Paragraph text</p>",
      navigation: {},
      basePath: "",
    };

    const html = await renderJsxLayout(layoutPath, templateData);

    expect(html).toContain("<h2>Subheading</h2>");
    expect(html).toContain("<p>Paragraph text</p>");
  });

  it("should receive navigation data", async () => {
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

  it("should receive basePath", async () => {
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

describe("templates - error handling", () => {
  it("should fail when Layout export is missing", async () => {
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

  it("should fail when layout file does not exist", async () => {
    const layoutPath = join(fixturesDir, "_layout-nonexistent.tsx");

    const templateData: TemplateData = {
      title: "Test",
      content: "",
      navigation: {},
      basePath: "",
    };

    await expect(renderJsxLayout(layoutPath, templateData)).rejects.toThrow();
  });
});
