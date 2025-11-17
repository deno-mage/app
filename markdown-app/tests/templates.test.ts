import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { renderJsxLayout } from "../jsx-renderer.tsx";
import type { LayoutProps } from "../layout.ts";
import { join } from "@std/path";

const fixturesDir = join(import.meta.dirname!, "fixtures", "layouts");

/**
 * Create a mock asset function for tests.
 */
function createAssetFunction(
  basePath: string,
  assetMap: Record<string, string> = {},
): (path: string) => string {
  const normalizedBasePath = basePath === "/" ? "" : basePath;
  return (path: string) => {
    const hashedPath = assetMap[path];
    if (hashedPath !== undefined) {
      return hashedPath;
    }
    return `${normalizedBasePath}/${path}`.replace(/\/\/+/g, "/");
  };
}

describe("templates - basic rendering", () => {
  it("should render JSX layout to HTML", async () => {
    const layoutPath = join(fixturesDir, "_layout-test.tsx");

    const layoutProps: LayoutProps = {
      title: "Test Page",
      articleHtml: "<p>Hello World</p>",
      navigation: {},
      basePath: "",
      asset: createAssetFunction(""),
    };

    const html = await renderJsxLayout(layoutPath, layoutProps);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Test Page</title>");
    expect(html).toContain("<h1>Test Page</h1>");
    expect(html).toContain("<p>Hello World</p>");
  });

  it("should handle file:// URLs correctly", async () => {
    const layoutPath = join(fixturesDir, "_layout-fileurl.tsx");
    const fileUrl = `file://${layoutPath}`;

    const layoutProps: LayoutProps = {
      title: "File URL Test",
      articleHtml: "",
      navigation: {},
      basePath: "",
      asset: createAssetFunction(""),
    };

    const html = await renderJsxLayout(fileUrl, layoutProps);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>File URL Test</title>");
  });
});

describe("templates - data passing", () => {
  it("should receive frontmatter data (title)", async () => {
    const layoutPath = join(fixturesDir, "_layout-test.tsx");

    const layoutProps: LayoutProps = {
      title: "Custom Title",
      articleHtml: "<p>Content</p>",
      navigation: {},
      basePath: "",
      asset: createAssetFunction(""),
    };

    const html = await renderJsxLayout(layoutPath, layoutProps);

    expect(html).toContain("<title>Custom Title</title>");
    expect(html).toContain("<h1>Custom Title</h1>");
  });

  it("should receive markdown content", async () => {
    const layoutPath = join(fixturesDir, "_layout-test.tsx");

    const layoutProps: LayoutProps = {
      title: "Test",
      articleHtml: "<h2>Subheading</h2><p>Paragraph text</p>",
      navigation: {},
      basePath: "",
      asset: createAssetFunction(""),
    };

    const html = await renderJsxLayout(layoutPath, layoutProps);

    expect(html).toContain("<h2>Subheading</h2>");
    expect(html).toContain("<p>Paragraph text</p>");
  });

  it("should receive navigation data", async () => {
    const layoutPath = join(fixturesDir, "_layout-nav.tsx");

    const layoutProps: LayoutProps = {
      title: "Nav Test",
      articleHtml: "<p>Content</p>",
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
      asset: createAssetFunction(""),
    };

    const html = await renderJsxLayout(layoutPath, layoutProps);

    expect(html).toContain("2 sections");
  });

  it("should receive basePath and asset function", async () => {
    const layoutPath = join(fixturesDir, "_layout-basepath.tsx");

    const layoutProps: LayoutProps = {
      title: "Base Path Test",
      articleHtml: "",
      navigation: {},
      basePath: "/docs",
      asset: createAssetFunction("/docs"),
    };

    const html = await renderJsxLayout(layoutPath, layoutProps);

    expect(html).toContain('href="/docs/home"');
  });

  it("should use cache-busted asset URLs when available", async () => {
    const layoutPath = join(fixturesDir, "_layout-basepath.tsx");

    const layoutProps: LayoutProps = {
      title: "Asset Test",
      articleHtml: "",
      navigation: {},
      basePath: "/docs",
      asset: createAssetFunction("/docs", {
        "home": "/__assets/home-abc123.html",
      }),
    };

    const html = await renderJsxLayout(layoutPath, layoutProps);

    expect(html).toContain('href="/__assets/home-abc123.html"');
  });
});

describe("templates - auto-injection", () => {
  it("should auto-inject title from LayoutProps", async () => {
    const layoutPath = join(fixturesDir, "_layout-docs.tsx");

    const layoutProps: LayoutProps = {
      title: "Auto Injected Title",
      articleHtml: "<p>Content</p>",
      navigation: {},
      basePath: "",
      asset: createAssetFunction(""),
    };

    const html = await renderJsxLayout(layoutPath, layoutProps);

    expect(html).toContain("<title>Auto Injected Title</title>");
  });

  it("should auto-inject description meta tag when provided", async () => {
    const layoutPath = join(fixturesDir, "_layout-docs.tsx");

    const layoutProps: LayoutProps = {
      title: "Test",
      articleHtml: "<p>Content</p>",
      description: "This is a test description",
      navigation: {},
      basePath: "",
      asset: createAssetFunction(""),
    };

    const html = await renderJsxLayout(layoutPath, layoutProps);

    expect(html).toContain(
      '<meta name="description" content="This is a test description" />',
    );
  });

  it("should not inject description meta tag when not provided", async () => {
    const layoutPath = join(fixturesDir, "_layout-docs.tsx");

    const layoutProps: LayoutProps = {
      title: "Test",
      articleHtml: "<p>Content</p>",
      navigation: {},
      basePath: "",
      asset: createAssetFunction(""),
    };

    const html = await renderJsxLayout(layoutPath, layoutProps);

    expect(html).not.toContain('<meta name="description"');
  });

  it("should auto-inject GitHub CSS link", async () => {
    const layoutPath = join(fixturesDir, "_layout-docs.tsx");

    const layoutProps: LayoutProps = {
      title: "Test",
      articleHtml: "<p>Content</p>",
      navigation: {},
      basePath: "",
      asset: createAssetFunction(""),
    };

    const html = await renderJsxLayout(layoutPath, layoutProps);

    expect(html).toContain('<link rel="stylesheet" href="/gfm.css" />');
  });

  it("should auto-inject charset and viewport meta tags", async () => {
    const layoutPath = join(fixturesDir, "_layout-docs.tsx");

    const layoutProps: LayoutProps = {
      title: "Test",
      articleHtml: "<p>Content</p>",
      navigation: {},
      basePath: "",
      asset: createAssetFunction(""),
    };

    const html = await renderJsxLayout(layoutPath, layoutProps);

    expect(html).toContain('<meta charset="UTF-8" />');
    expect(html).toContain(
      '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    );
  });

  it("should extract and hoist multiple Head components", async () => {
    const layoutPath = join(fixturesDir, "_layout-multiple-heads.tsx");

    const layoutProps: LayoutProps = {
      title: "Test Multiple Heads",
      articleHtml: "<p>Article content</p>",
      navigation: {},
      basePath: "",
      asset: createAssetFunction(""),
    };

    const html = await renderJsxLayout(layoutPath, layoutProps);

    // Should contain auto-injected title
    expect(html).toContain("<title>Test Multiple Heads</title>");

    // Should contain custom resources from Head components
    expect(html).toContain('<link rel="stylesheet" href="/custom.css"/>');
    expect(html).toContain(
      '<meta name="description" content="Second head block"/>',
    );

    // Head tags should be removed from body
    expect(html).not.toMatch(/<body>[\s\S]*<head>/);
  });
});

describe("templates - error handling", () => {
  it("should fail when Layout export is missing", async () => {
    const layoutPath = join(fixturesDir, "_layout-bad.tsx");

    const layoutProps: LayoutProps = {
      title: "Test",
      articleHtml: "<p>Content</p>",
      navigation: {},
      basePath: "",
      asset: createAssetFunction(""),
    };

    await expect(renderJsxLayout(layoutPath, layoutProps)).rejects.toThrow(
      'must export a "Layout" component',
    );
  });

  it("should fail when layout file does not exist", async () => {
    const layoutPath = join(fixturesDir, "_layout-nonexistent.tsx");

    const layoutProps: LayoutProps = {
      title: "Test",
      articleHtml: "",
      navigation: {},
      basePath: "",
      asset: createAssetFunction(""),
    };

    await expect(renderJsxLayout(layoutPath, layoutProps)).rejects.toThrow();
  });
});
