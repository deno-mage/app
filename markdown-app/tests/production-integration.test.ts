import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { markdownApp } from "../mod.ts";
import { copy } from "@std/fs";
import { join } from "@std/path";

const fixturesDir = join(import.meta.dirname!, "fixtures");
const layoutFixture = join(fixturesDir, "layouts", "_layout-docs.tsx");

describe("markdown-app - production integration", () => {
  let tempDir: string;
  let sourceDir: string;
  let outputDir: string;

  beforeEach(async () => {
    tempDir = await Deno.makeTempDir({ prefix: "markdown-app-prod-test-" });
    sourceDir = join(tempDir, "source");
    outputDir = join(tempDir, "output");

    // Create source directory
    await Deno.mkdir(sourceDir, { recursive: true });

    // Create a simple markdown file
    await Deno.writeTextFile(
      join(sourceDir, "index.md"),
      `---
title: Home Page
slug: index
layout: docs
description: Welcome to our site
lastmod: 2025-01-15
changefreq: weekly
priority: 1.0
---

# Welcome

This is the home page.`,
    );

    // Create a layout file
    await copy(layoutFixture, join(sourceDir, "_layout-docs.tsx"));
  });

  afterEach(() => {
    // Temp files are excluded from coverage, no cleanup needed
  });

  it("should generate all production files when siteMetadata is provided", async () => {
    const app = markdownApp({
      sourceDir,
      outputDir,
      layoutDir: sourceDir,
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

    // Check that HTML was generated
    const indexHtml = await Deno.readTextFile(join(outputDir, "index.html"));
    expect(indexHtml).toContain("This is the home page");

    // Check that sitemap.xml was generated
    const sitemap = await Deno.readTextFile(join(outputDir, "sitemap.xml"));
    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toContain("<loc>https://example.com</loc>");
    expect(sitemap).toContain("<lastmod>2025-01-15</lastmod>");
    expect(sitemap).toContain("<changefreq>weekly</changefreq>");
    expect(sitemap).toContain("<priority>1.0</priority>");

    // Check that robots.txt was generated
    const robotsTxt = await Deno.readTextFile(join(outputDir, "robots.txt"));
    expect(robotsTxt).toContain("User-agent: *");
    expect(robotsTxt).toContain("Sitemap: https://example.com/sitemap.xml");

    // Check that manifest.webmanifest was generated
    const manifest = await Deno.readTextFile(
      join(outputDir, "manifest.webmanifest"),
    );
    const manifestJson = JSON.parse(manifest);
    expect(manifestJson.name).toBe("Test Site");
    expect(manifestJson.description).toBe("A test documentation site");
    expect(manifestJson.theme_color).toBe("#1e40af");
    expect(manifestJson.icons).toBeDefined();
    expect(manifestJson.icons[0].src).toBe("/icon-192.png");

    // Check that GFM CSS was generated
    const gfmCss = await Deno.readTextFile(join(outputDir, "gfm.css"));
    expect(gfmCss).toContain("prettylights");
  });

  it("should NOT generate production files when siteMetadata is NOT provided", async () => {
    const outputDir2 = join(tempDir, "output2");

    const app = markdownApp({
      sourceDir,
      outputDir: outputDir2,
      layoutDir: sourceDir,
      basePath: "/",
      dev: false,
      // No siteMetadata
    });

    await app.build();

    // Check that HTML was generated
    const indexHtml = await Deno.readTextFile(join(outputDir2, "index.html"));
    expect(indexHtml).toContain("This is the home page");

    // Check that production files were NOT generated
    let sitemapExists = false;
    let robotsExists = false;
    let manifestExists = false;

    try {
      await Deno.readTextFile(join(outputDir2, "sitemap.xml"));
      sitemapExists = true;
    } catch {
      // Expected
    }

    try {
      await Deno.readTextFile(join(outputDir2, "robots.txt"));
      robotsExists = true;
    } catch {
      // Expected
    }

    try {
      await Deno.readTextFile(join(outputDir2, "manifest.webmanifest"));
      manifestExists = true;
    } catch {
      // Expected
    }

    expect(sitemapExists).toBe(false);
    expect(robotsExists).toBe(false);
    expect(manifestExists).toBe(false);

    // But GFM CSS should still be generated
    const gfmCss = await Deno.readTextFile(join(outputDir2, "gfm.css"));
    expect(gfmCss).toContain("prettylights");
  });
});
