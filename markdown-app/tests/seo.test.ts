import { beforeEach, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { markdownApp } from "../mod.ts";
import { exists } from "@std/fs";
import { join } from "@std/path";
import { setupBuildTest, writeMarkdownFile } from "./test-helpers.ts";

describe("seo - sitemap.xml generation", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await Deno.makeTempDir({ prefix: "markdown-app-seo-test-" });
  });

  it("should generate sitemap.xml with all metadata fields", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "index.md"),
      {
        title: "Home Page",
        slug: "index",
        layout: "docs",
        description: "Welcome to our site",
        lastmod: "2025-01-15",
        changefreq: "weekly",
        priority: 1.0,
      },
      "# Welcome",
    );

    await writeMarkdownFile(
      join(articlesDir, "about.md"),
      {
        title: "About",
        slug: "about",
        layout: "docs",
        lastmod: "2025-01-14",
        changefreq: "monthly",
        priority: 0.8,
      },
      "# About",
    );

    const app = markdownApp({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
      siteMetadata: {
        siteUrl: "https://example.com",
        siteName: "Test Site",
        description: "A test documentation site",
      },
    });

    await app.build();

    const sitemap = await Deno.readTextFile(join(outputDir, "sitemap.xml"));

    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(sitemap).toContain("<loc>https://example.com</loc>");
    expect(sitemap).toContain("<loc>https://example.com/about</loc>");
    expect(sitemap).toContain("<lastmod>2025-01-15</lastmod>");
    expect(sitemap).toContain("<changefreq>weekly</changefreq>");
    expect(sitemap).toContain("<priority>1.0</priority>");
  });

  it("should include basePath in sitemap URLs", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "index.md"),
      { title: "Home", slug: "index", layout: "docs" },
      "# Home",
    );

    const app = markdownApp({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/docs",
      dev: false,
      siteMetadata: {
        siteUrl: "https://example.com",
      },
    });

    await app.build();

    const sitemap = await Deno.readTextFile(join(outputDir, "sitemap.xml"));

    expect(sitemap).toContain("<loc>https://example.com/docs</loc>");
  });

  it("should NOT generate sitemap.xml when siteMetadata NOT provided", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "index.md"),
      { title: "Home", slug: "index", layout: "docs" },
      "# Home",
    );

    const app = markdownApp({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
    });

    await app.build();

    expect(await exists(join(outputDir, "sitemap.xml"))).toBe(false);
  });
});

describe("seo - robots.txt generation", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await Deno.makeTempDir({ prefix: "markdown-app-robots-" });
  });

  it("should generate robots.txt with sitemap reference", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "index.md"),
      { title: "Home", slug: "index", layout: "docs" },
      "# Home",
    );

    const app = markdownApp({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
      siteMetadata: {
        siteUrl: "https://example.com",
      },
    });

    await app.build();

    const robots = await Deno.readTextFile(join(outputDir, "robots.txt"));

    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Sitemap: https://example.com/sitemap.xml");
  });

  it("should include basePath in robots.txt sitemap URL", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "index.md"),
      { title: "Home", slug: "index", layout: "docs" },
      "# Home",
    );

    const app = markdownApp({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/docs",
      dev: false,
      siteMetadata: {
        siteUrl: "https://example.com",
      },
    });

    await app.build();

    const robots = await Deno.readTextFile(join(outputDir, "robots.txt"));

    expect(robots).toContain(
      "Sitemap: https://example.com/docs/sitemap.xml",
    );
  });

  it("should NOT generate robots.txt when siteMetadata NOT provided", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "index.md"),
      { title: "Home", slug: "index", layout: "docs" },
      "# Home",
    );

    const app = markdownApp({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
    });

    await app.build();

    expect(await exists(join(outputDir, "robots.txt"))).toBe(false);
  });
});

describe("seo - manifest.webmanifest generation", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await Deno.makeTempDir({ prefix: "markdown-app-manifest-" });
  });

  it("should generate manifest.webmanifest with all metadata fields", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "index.md"),
      { title: "Home", slug: "index", layout: "docs" },
      "# Home",
    );

    const app = markdownApp({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
      siteMetadata: {
        siteUrl: "https://example.com",
        siteName: "Test Site",
        description: "A test documentation site",
        themeColor: "#1e40af",
        icon192Path: "icon-192.png",
      },
    });

    await app.build();

    const manifest = await Deno.readTextFile(
      join(outputDir, "manifest.webmanifest"),
    );
    const manifestJson = JSON.parse(manifest);

    expect(manifestJson.name).toBe("Test Site");
    expect(manifestJson.description).toBe("A test documentation site");
    expect(manifestJson.theme_color).toBe("#1e40af");
    expect(manifestJson.icons).toBeDefined();
    expect(manifestJson.icons[0].src).toBe("/icon-192.png");
  });

  it("should use default values when optional fields not provided", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "index.md"),
      { title: "Home", slug: "index", layout: "docs" },
      "# Home",
    );

    const app = markdownApp({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
      siteMetadata: {
        siteUrl: "https://example.com",
      },
    });

    await app.build();

    const manifest = await Deno.readTextFile(
      join(outputDir, "manifest.webmanifest"),
    );
    const manifestJson = JSON.parse(manifest);

    expect(manifestJson.name).toBe("Documentation");
    expect(manifestJson.short_name).toBe("Docs");
    expect(manifestJson.theme_color).toBe("#ffffff");
  });

  it("should include basePath in manifest start_url", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "index.md"),
      { title: "Home", slug: "index", layout: "docs" },
      "# Home",
    );

    const app = markdownApp({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/docs",
      dev: false,
      siteMetadata: {
        siteUrl: "https://example.com",
      },
    });

    await app.build();

    const manifest = await Deno.readTextFile(
      join(outputDir, "manifest.webmanifest"),
    );
    const manifestJson = JSON.parse(manifest);

    expect(manifestJson.start_url).toBe("/docs/");
  });

  it("should NOT generate manifest.webmanifest when siteMetadata NOT provided", async () => {
    const { articlesDir, outputDir, layoutDir } = await setupBuildTest({
      tempDir,
    });

    await writeMarkdownFile(
      join(articlesDir, "index.md"),
      { title: "Home", slug: "index", layout: "docs" },
      "# Home",
    );

    const app = markdownApp({
      articlesDir,
      outputDir,
      layoutDir,
      basePath: "/",
      dev: false,
    });

    await app.build();

    expect(await exists(join(outputDir, "manifest.webmanifest"))).toBe(false);
  });
});
