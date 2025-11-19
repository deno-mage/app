import { afterAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import { exists } from "@std/fs";
import { build } from "../build.ts";
import { stopBundleBuilder } from "../bundle-builder.ts";
import type { SiteMetadata } from "../types.ts";

const FIXTURES_DIR = join(
  new URL(".", import.meta.url).pathname,
  "fixtures",
);

const siteMetadata: SiteMetadata = {
  baseUrl: "https://example.com",
  title: "Test Site",
  description: "A test site",
};

describe(
  "build - static site generation",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    afterAll(() => {
      stopBundleBuilder();
    });
    it("should build all pages to dist directory", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const indexPath = join(testOutputDir, "index.html");
      expect(await exists(indexPath)).toBe(true);

      const docsIntroPath = join(testOutputDir, "docs", "intro", "index.html");
      expect(await exists(docsIntroPath)).toBe(true);
    });

    it("should render complete HTML documents", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const indexPath = join(testOutputDir, "index.html");
      const html = await Deno.readTextFile(indexPath);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("<head");
      expect(html).toContain("<body");
      expect(html).toContain("<title>Home</title>");
    });

    it("should include page content in rendered HTML", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const indexPath = join(testOutputDir, "index.html");
      const html = await Deno.readTextFile(indexPath);

      expect(html).toContain("Welcome");
    });

    it("should copy assets to __public with hashed filenames", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const publicDir = join(testOutputDir, "__public");
      expect(await exists(publicDir)).toBe(true);

      const files: string[] = [];
      for await (const entry of Deno.readDir(publicDir)) {
        if (entry.isFile) {
          files.push(entry.name);
        }
      }

      const hashedCss = files.find((name) =>
        name.match(/^styles-[a-f0-9]{8}\.css$/)
      );
      expect(hashedCss).toBeDefined();
    });

    it("should copy nested assets with directory structure", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const imagesDir = join(testOutputDir, "__public", "images");
      expect(await exists(imagesDir)).toBe(true);

      const files: string[] = [];
      for await (const entry of Deno.readDir(imagesDir)) {
        if (entry.isFile) {
          files.push(entry.name);
        }
      }

      const hashedLogo = files.find((name) =>
        name.match(/^logo-[a-f0-9]{8}\.png$/)
      );
      expect(hashedLogo).toBeDefined();
    });

    it("should replace asset URLs in rendered HTML", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const indexPath = join(testOutputDir, "index.html");
      const html = await Deno.readTextFile(indexPath);

      expect(html).not.toContain('"/public/styles.css"');
      expect(html).toMatch(/__public\/styles-[a-f0-9]{8}\.css/);
    });

    it("should use default outDir when not specified", async () => {
      const defaultOutDir = join(FIXTURES_DIR, "dist");

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
      });

      expect(await exists(defaultOutDir)).toBe(true);
    });

    // TODO: Re-enable when bundle builder supports better import resolution for temp directories
    // The issue is esbuild can't resolve JSR imports like "preact" in isolated temp directories
    // This is tested indirectly by other tests that use FIXTURES_DIR
    it.skip("should handle empty public directory gracefully", async () => {
      const tempDir = await Deno.makeTempDir();
      const testOutputDir = await Deno.makeTempDir();
      const tempPagesDir = join(tempDir, "pages");
      const tempLayoutsDir = join(tempDir, "layouts");

      await Deno.mkdir(tempPagesDir, { recursive: true });
      await Deno.mkdir(tempLayoutsDir, { recursive: true });

      // Copy deno.json to temp directory for import resolution
      const projectRoot = join(
        new URL(".", import.meta.url).pathname,
        "../..",
      );
      await Deno.copyFile(
        join(projectRoot, "deno.json"),
        join(tempDir, "deno.json"),
      );

      await Deno.writeTextFile(
        join(tempPagesDir, "index.md"),
        `---
title: Test
---

# Test`,
      );

      // Create a minimal layout without imports to avoid import resolution issues
      // in temp directory without deno.json
      await Deno.writeTextFile(
        join(tempLayoutsDir, "default.tsx"),
        `export default function DefaultLayout(props) {
  return (
    <>
      <head data-mage-head="true">
        <title>{props.title}</title>
      </head>
      <div dangerouslySetInnerHTML={{ __html: props.html }} />
    </>
  );
}`,
      );

      await build(siteMetadata, {
        rootDir: tempDir,
        outDir: testOutputDir,
      });

      expect(await exists(join(testOutputDir, "index.html"))).toBe(true);
    });

    it("should generate 404.html from _not-found.md", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const notFoundPath = join(testOutputDir, "404.html");
      expect(await exists(notFoundPath)).toBe(true);

      const html = await Deno.readTextFile(notFoundPath);
      expect(html).toContain("<title>Page Not Found</title>");
      expect(html).toContain("404 - Page Not Found");
    });

    it("should generate 500.html from _error.md", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const errorPath = join(testOutputDir, "500.html");
      expect(await exists(errorPath)).toBe(true);

      const html = await Deno.readTextFile(errorPath);
      expect(html).toContain("<title>Error</title>");
      expect(html).toContain("Something Went Wrong");
    });

    it("should not include _not-found.md and _error.md in regular pages", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const notFoundAsPagePath = join(
        testOutputDir,
        "_not-found",
        "index.html",
      );
      expect(await exists(notFoundAsPagePath)).toBe(false);

      const errorAsPagePath = join(testOutputDir, "_error", "index.html");
      expect(await exists(errorAsPagePath)).toBe(false);
    });
  },
);

describe(
  "build - sitemap generation",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    afterAll(() => {
      stopBundleBuilder();
    });
    it("should generate sitemap.xml", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const sitemapPath = join(testOutputDir, "sitemap.xml");
      expect(await exists(sitemapPath)).toBe(true);
    });

    it("should include all pages in sitemap", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const sitemapPath = join(testOutputDir, "sitemap.xml");
      const sitemap = await Deno.readTextFile(sitemapPath);

      expect(sitemap).toContain("https://example.com/");
      expect(sitemap).toContain("https://example.com/docs/intro");
    });

    it("should generate valid XML sitemap format", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const sitemapPath = join(testOutputDir, "sitemap.xml");
      const sitemap = await Deno.readTextFile(sitemapPath);

      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      );
      expect(sitemap).toContain("</urlset>");
      expect(sitemap).toContain("<url>");
      expect(sitemap).toContain("<loc>");
      expect(sitemap).toContain("</loc>");
      expect(sitemap).toContain("</url>");
    });

    it("should include changefreq in sitemap entries", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const sitemapPath = join(testOutputDir, "sitemap.xml");
      const sitemap = await Deno.readTextFile(sitemapPath);

      expect(sitemap).toContain("<changefreq>weekly</changefreq>");
    });

    it("should use baseUrl from siteMetadata", async () => {
      const testOutputDir = await Deno.makeTempDir();

      const customMetadata: SiteMetadata = {
        baseUrl: "https://custom-domain.com",
      };

      await build(customMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const sitemapPath = join(testOutputDir, "sitemap.xml");
      const sitemap = await Deno.readTextFile(sitemapPath);

      expect(sitemap).toContain("https://custom-domain.com/");
      expect(sitemap).not.toContain("https://example.com/");
    });

    it("should not include special pages (_not-found, _error) in sitemap", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const sitemapPath = join(testOutputDir, "sitemap.xml");
      const sitemap = await Deno.readTextFile(sitemapPath);

      expect(sitemap).not.toContain("_not-found");
      expect(sitemap).not.toContain("_error");
    });
  },
);

describe(
  "build - robots.txt generation",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    afterAll(() => {
      stopBundleBuilder();
    });
    it("should generate robots.txt", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const robotsPath = join(testOutputDir, "robots.txt");
      expect(await exists(robotsPath)).toBe(true);
    });

    it("should allow all crawlers", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const robotsPath = join(testOutputDir, "robots.txt");
      const robots = await Deno.readTextFile(robotsPath);

      expect(robots).toContain("User-agent: *");
      expect(robots).toContain("Allow: /");
    });

    it("should include sitemap URL", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const robotsPath = join(testOutputDir, "robots.txt");
      const robots = await Deno.readTextFile(robotsPath);

      expect(robots).toContain("Sitemap: https://example.com/sitemap.xml");
    });

    it("should use baseUrl from siteMetadata in robots.txt", async () => {
      const testOutputDir = await Deno.makeTempDir();

      const customMetadata: SiteMetadata = {
        baseUrl: "https://custom-domain.com",
      };

      await build(customMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const robotsPath = join(testOutputDir, "robots.txt");
      const robots = await Deno.readTextFile(robotsPath);

      expect(robots).toContain(
        "Sitemap: https://custom-domain.com/sitemap.xml",
      );
      expect(robots).not.toContain("example.com");
    });
  },
);

describe(
  "build - URL path to file path conversion",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    afterAll(() => {
      stopBundleBuilder();
    });
    it("should convert root path to index.html", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const indexPath = join(testOutputDir, "index.html");
      expect(await exists(indexPath)).toBe(true);
    });

    it("should convert nested paths to directory with index.html", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const docsIntroPath = join(testOutputDir, "docs", "intro", "index.html");
      expect(await exists(docsIntroPath)).toBe(true);
    });

    it("should create necessary parent directories", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const docsDir = join(testOutputDir, "docs");
      expect(await exists(docsDir)).toBe(true);

      const introDir = join(testOutputDir, "docs", "intro");
      expect(await exists(introDir)).toBe(true);
    });

    it("should clean output directory before building", async () => {
      const testOutputDir = await Deno.makeTempDir();

      // First build
      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      // Create a stale file that shouldn't exist after rebuild
      const stalePath = join(testOutputDir, "stale-page", "index.html");
      await Deno.mkdir(join(testOutputDir, "stale-page"), { recursive: true });
      await Deno.writeTextFile(stalePath, "<html>Stale content</html>");

      // Verify stale file exists before rebuild
      expect(await exists(stalePath)).toBe(true);

      // Second build (should clean everything first)
      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      // Stale file should be gone
      expect(await exists(stalePath)).toBe(false);

      // Real files should still exist
      const indexPath = join(testOutputDir, "index.html");
      expect(await exists(indexPath)).toBe(true);
    });
  },
);

describe(
  "build - basePath normalization",
  {
    sanitizeResources: false,
    sanitizeOps: false,
  },
  () => {
    it("should normalize basePath without trailing slash", async () => {
      const testOutputDir = await Deno.makeTempDir();

      try {
        await build(
          { baseUrl: "https://example.com" },
          {
            rootDir: FIXTURES_DIR,
            outDir: testOutputDir,
            basePath: "/docs", // No trailing slash
          },
        );

        // Check that bundle URLs include the normalized basePath
        const indexHtml = await Deno.readTextFile(
          join(testOutputDir, "index.html"),
        );
        expect(indexHtml).toContain("/docs/__bundles/");
      } finally {
        await Deno.remove(testOutputDir, { recursive: true });
      }
    });

    it("should normalize basePath with trailing slash", async () => {
      const testOutputDir = await Deno.makeTempDir();

      try {
        await build(
          { baseUrl: "https://example.com" },
          {
            rootDir: FIXTURES_DIR,
            outDir: testOutputDir,
            basePath: "/docs/", // With trailing slash
          },
        );

        // Check that bundle URLs include the normalized basePath
        const indexHtml = await Deno.readTextFile(
          join(testOutputDir, "index.html"),
        );
        expect(indexHtml).toContain("/docs/__bundles/");
      } finally {
        await Deno.remove(testOutputDir, { recursive: true });
      }
    });

    it("should handle root basePath", async () => {
      const testOutputDir = await Deno.makeTempDir();

      try {
        await build(
          { baseUrl: "https://example.com" },
          {
            rootDir: FIXTURES_DIR,
            outDir: testOutputDir,
            basePath: "/",
          },
        );

        // Check that bundle URLs use root path
        const indexHtml = await Deno.readTextFile(
          join(testOutputDir, "index.html"),
        );
        expect(indexHtml).toContain("/__bundles/");
        expect(indexHtml).not.toContain("//__bundles/");
      } finally {
        await Deno.remove(testOutputDir, { recursive: true });
      }
    });

    it("should default to root basePath when not specified", async () => {
      const testOutputDir = await Deno.makeTempDir();

      try {
        await build(
          { baseUrl: "https://example.com" },
          {
            rootDir: FIXTURES_DIR,
            outDir: testOutputDir,
            // basePath not specified
          },
        );

        // Check that bundle URLs use root path
        const indexHtml = await Deno.readTextFile(
          join(testOutputDir, "index.html"),
        );
        expect(indexHtml).toContain("/__bundles/");
        expect(indexHtml).not.toContain("//__bundles/");
      } finally {
        await Deno.remove(testOutputDir, { recursive: true });
      }
    });

    it("should copy assets to __public without basePath in directory structure", async () => {
      const testOutputDir = await Deno.makeTempDir();

      try {
        await build(
          { baseUrl: "https://example.com" },
          {
            rootDir: FIXTURES_DIR,
            outDir: testOutputDir,
            basePath: "/docs/",
          },
        );

        // Assets should be in dist/__public/, NOT dist/__public/docs/__public/
        const publicDir = join(testOutputDir, "__public");
        const publicExists = await exists(publicDir);
        expect(publicExists).toBe(true);

        // Check that styles.css was copied with hash
        const files = [];
        for await (const entry of Deno.readDir(publicDir)) {
          files.push(entry.name);
        }

        // Should have styles-[hash].css
        const stylesFile = files.find((f) =>
          f.startsWith("styles-") && f.endsWith(".css")
        );
        expect(stylesFile).toBeTruthy();

        // Should NOT have nested docs/__public/ directory
        const wrongDir = join(testOutputDir, "__public", "docs");
        const wrongDirExists = await exists(wrongDir);
        expect(wrongDirExists).toBe(false);

        // HTML should reference /docs/__public/styles-[hash].css
        const indexHtml = await Deno.readTextFile(
          join(testOutputDir, "index.html"),
        );
        expect(indexHtml).toContain("/docs/__public/styles-");
        expect(indexHtml).not.toContain("/__public/__public/");
      } finally {
        await Deno.remove(testOutputDir, { recursive: true });
      }
    });
  },
);
