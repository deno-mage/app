import { beforeEach, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { build } from "../builder.ts";
import { join } from "@std/path";
import { exists } from "@std/fs";
import { setupBuildTest, writeMarkdownFile } from "./test-helpers.ts";

describe("build - basic functionality", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await Deno.makeTempDir({ prefix: "markdown-app-build-test-" });
  });

  it("should convert markdown files to static HTML with correct structure", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "test.md"),
      { title: "Test Page", slug: "test", layout: "docs" },
      "# Hello World",
    );

    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
      syntaxHighlightLanguages: ["typescript", "bash", "json", "yaml"],
    });

    const outputFile = join(outputDir, "test.html");
    expect(await exists(outputFile)).toBe(true);

    const content = await Deno.readTextFile(outputFile);
    expect(content).toContain("<title>Test Page</title>");
    expect(content).toContain("<h1");
    expect(content).toContain("Hello World");
  });

  it("should create index.html for pages with 'index' slug", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "index.md"),
      { title: "Home", slug: "index", layout: "docs" },
      "Home page",
    );

    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
      syntaxHighlightLanguages: [],
    });

    const indexFile = join(outputDir, "index.html");
    expect(await exists(indexFile)).toBe(true);

    const content = await Deno.readTextFile(indexFile);
    expect(content).toContain("Home page");
  });

  it("should create directory structure for nested slugs", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "guide.md"),
      { title: "Guide", slug: "api/router", layout: "docs" },
      "Content",
    );

    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
      syntaxHighlightLanguages: [],
    });

    const outputFile = join(outputDir, "api/router.html");
    expect(await exists(outputFile)).toBe(true);
  });

  it("should find and build markdown files recursively in subdirectories", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await Deno.mkdir(join(articlesDir, "nested"), { recursive: true });

    await writeMarkdownFile(
      join(articlesDir, "root.md"),
      { title: "Root", slug: "root", layout: "docs" },
      "Root content",
    );

    await writeMarkdownFile(
      join(articlesDir, "nested", "nested.md"),
      { title: "Nested", slug: "nested", layout: "docs" },
      "Nested content",
    );

    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
      syntaxHighlightLanguages: [],
    });

    expect(await exists(join(outputDir, "root.html"))).toBe(true);
    expect(await exists(join(outputDir, "nested.html"))).toBe(true);
  });

  it("should handle empty source directory without errors", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
      syntaxHighlightLanguages: [],
    });

    // Should complete successfully without throwing
  });

  it("should generate GFM CSS file in output directory", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "test.md"),
      { title: "Test", slug: "test", layout: "docs" },
      "Content",
    );

    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
      syntaxHighlightLanguages: [],
    });

    const cssFile = join(outputDir, "gfm.css");
    expect(await exists(cssFile)).toBe(true);

    const css = await Deno.readTextFile(cssFile);
    expect(css.length).toBeGreaterThan(0);
  });
});

describe("build - navigation", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await Deno.makeTempDir({ prefix: "markdown-app-build-nav-" });
  });

  it("should generate navigation links across all pages with nav-item", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
      withNav: true,
    });

    await writeMarkdownFile(
      join(articlesDir, "page1.md"),
      {
        title: "Page 1",
        slug: "page1",
        layout: "docs",
        "nav-item": "Page 1",
        "nav-group": "default",
        "nav-order": 1,
      },
      "Content 1",
    );

    await writeMarkdownFile(
      join(articlesDir, "page2.md"),
      {
        title: "Page 2",
        slug: "page2",
        layout: "docs",
        "nav-item": "Page 2",
        "nav-group": "default",
        "nav-order": 2,
      },
      "Content 2",
    );

    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
      syntaxHighlightLanguages: [],
    });

    const page1Content = await Deno.readTextFile(
      join(outputDir, "page1.html"),
    );
    expect(page1Content).toContain('href="/page1"');
    expect(page1Content).toContain('href="/page2"');
    expect(page1Content).toContain('aria-current="page"');

    const page2Content = await Deno.readTextFile(
      join(outputDir, "page2.html"),
    );
    expect(page2Content).toContain('href="/page1"');
    expect(page2Content).toContain('href="/page2"');
  });

  it("should include basePath in all navigation URLs", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
      withNav: true,
    });

    await writeMarkdownFile(
      join(articlesDir, "test.md"),
      {
        title: "Test",
        slug: "test",
        layout: "docs",
        "nav-item": "Test",
        "nav-group": "default",
      },
      "Content",
    );

    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/docs",
      dev: false,
      syntaxHighlightLanguages: [],
    });

    const content = await Deno.readTextFile(join(outputDir, "test.html"));
    expect(content).toContain('href="/docs/test"');
  });
});

describe("build - dev mode", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await Deno.makeTempDir({ prefix: "markdown-app-build-dev-" });
  });

  it("should inject hot reload WebSocket script in dev mode", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "test.md"),
      { title: "Test", slug: "test", layout: "docs" },
      "Content",
    );

    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: true,
      syntaxHighlightLanguages: [],
    });

    const content = await Deno.readTextFile(join(outputDir, "test.html"));
    expect(content).toContain("__hot-reload");
    expect(content).toContain("WebSocket");
    expect(content).toContain("<script>");
  });

  it("should not inject hot reload script in production mode", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "test.md"),
      { title: "Test", slug: "test", layout: "docs" },
      "Content",
    );

    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
      syntaxHighlightLanguages: [],
    });

    const content = await Deno.readTextFile(join(outputDir, "test.html"));
    expect(content).not.toContain("__hot-reload");
    expect(content).not.toContain("WebSocket");
  });

  it("should inject hot reload script before closing body tag", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "test.md"),
      { title: "Test", slug: "test", layout: "docs" },
      "Content",
    );

    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: true,
      syntaxHighlightLanguages: [],
    });

    const content = await Deno.readTextFile(join(outputDir, "test.html"));

    const scriptIndex = content.indexOf("<script>");
    const bodyCloseIndex = content.indexOf("</body>");
    expect(scriptIndex).toBeLessThan(bodyCloseIndex);
    expect(scriptIndex).toBeGreaterThan(-1);
  });
});

describe("build - layout cache busting", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await Deno.makeTempDir({
      prefix: "markdown-app-layout-cache-",
    });
  });

  it("should load fresh layout in dev mode when layout file changes", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "test.md"),
      { title: "Test", slug: "test", layout: "docs" },
      "Content",
    );

    // Write initial layout with a marker
    const layoutPath = join(layoutDir, "_layout-docs.tsx");
    await Deno.writeTextFile(
      layoutPath,
      `import type { LayoutProps } from "../../../mod.ts";

export function Layout(props: LayoutProps) {
  return <div data-version="v1"><main dangerouslySetInnerHTML={{ __html: props.articleHtml }} /></div>;
}`,
    );

    // First build
    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: true,
      syntaxHighlightLanguages: [],
    });

    let content = await Deno.readTextFile(join(outputDir, "test.html"));
    expect(content).toContain('data-version="v1"');

    // Wait a bit to ensure timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Update layout with different marker
    await Deno.writeTextFile(
      layoutPath,
      `import type { LayoutProps } from "../../../mod.ts";

export function Layout(props: LayoutProps) {
  return <div data-version="v2"><main dangerouslySetInnerHTML={{ __html: props.articleHtml }} /></div>;
}`,
    );

    // Second build - should pick up new layout
    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: true,
      syntaxHighlightLanguages: [],
    });

    content = await Deno.readTextFile(join(outputDir, "test.html"));
    expect(content).toContain('data-version="v2"');
    expect(content).not.toContain('data-version="v1"');
  });

  it("should load fresh layout in production mode when layout file changes", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "test.md"),
      { title: "Test", slug: "test", layout: "docs" },
      "Content",
    );

    // Write initial layout with a marker
    const layoutPath = join(layoutDir, "_layout-docs.tsx");
    await Deno.writeTextFile(
      layoutPath,
      `import type { LayoutProps } from "../../../mod.ts";

export function Layout(props: LayoutProps) {
  return <div data-version="prod-v1"><main dangerouslySetInnerHTML={{ __html: props.articleHtml }} /></div>;
}`,
    );

    // First build
    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
      syntaxHighlightLanguages: [],
    });

    let content = await Deno.readTextFile(join(outputDir, "test.html"));
    expect(content).toContain('data-version="prod-v1"');

    // Update layout with different marker
    await Deno.writeTextFile(
      layoutPath,
      `import type { LayoutProps } from "../../../mod.ts";

export function Layout(props: LayoutProps) {
  return <div data-version="prod-v2"><main dangerouslySetInnerHTML={{ __html: props.articleHtml }} /></div>;
}`,
    );

    // Second build - should pick up new layout
    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
      syntaxHighlightLanguages: [],
    });

    content = await Deno.readTextFile(join(outputDir, "test.html"));
    expect(content).toContain('data-version="prod-v2"');
    expect(content).not.toContain('data-version="prod-v1"');
  });

  it("should reload layout with updated component structure", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "test.md"),
      { title: "Test", slug: "test", layout: "docs" },
      "# Test Content",
    );

    const layoutPath = join(layoutDir, "_layout-docs.tsx");

    // Initial layout - simple structure
    await Deno.writeTextFile(
      layoutPath,
      `import type { LayoutProps } from "../../../mod.ts";

export function Layout(props: LayoutProps) {
  return <main dangerouslySetInnerHTML={{ __html: props.articleHtml }} />;
}`,
    );

    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: true,
      syntaxHighlightLanguages: [],
    });

    let content = await Deno.readTextFile(join(outputDir, "test.html"));
    expect(content).not.toContain("<header>");
    expect(content).not.toContain("<footer>");

    // Wait for timestamp to change
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Updated layout - with header and footer
    await Deno.writeTextFile(
      layoutPath,
      `import type { LayoutProps } from "../../../mod.ts";

export function Layout(props: LayoutProps) {
  return (
    <>
      <header><h1>Site Header</h1></header>
      <main dangerouslySetInnerHTML={{ __html: props.articleHtml }} />
      <footer>Site Footer</footer>
    </>
  );
}`,
    );

    await build({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: true,
      syntaxHighlightLanguages: [],
    });

    content = await Deno.readTextFile(join(outputDir, "test.html"));
    expect(content).toContain("<header>");
    expect(content).toContain("Site Header");
    expect(content).toContain("<footer>");
    expect(content).toContain("Site Footer");
  });
});

describe("build - error handling", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await Deno.makeTempDir({
      prefix: "markdown-app-build-errors-",
    });
  });

  it("should fail when layout file does not exist", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "test.md"),
      { title: "Test", slug: "test", layout: "nonexistent" },
      "Content",
    );

    await expect(
      build({
        articlesDir,
        outputDir,
        layoutDir,
        basePath: "/",
        dev: false,
        syntaxHighlightLanguages: [],
      }),
    ).rejects.toThrow("Failed to render layout");
  });

  it("should fail when duplicate slugs are detected", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "page1.md"),
      { title: "Page 1", slug: "duplicate", layout: "docs" },
      "Content 1",
    );

    await writeMarkdownFile(
      join(articlesDir, "page2.md"),
      { title: "Page 2", slug: "duplicate", layout: "docs" },
      "Content 2",
    );

    await expect(
      build({
        articlesDir,
        outputDir,
        layoutDir,
        basePath: "/",
        dev: false,
        syntaxHighlightLanguages: [],
      }),
    ).rejects.toThrow('Duplicate slug "duplicate" found');
  });
});
