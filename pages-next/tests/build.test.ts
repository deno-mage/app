/**
 * Tests for static site build functionality.
 *
 * @module
 */

import { afterAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import { exists } from "@std/fs";
import { build } from "../build.ts";
import { stopBundleBuilder } from "../bundle-builder.ts";
import type { SiteMetadata } from "../types.ts";

const FIXTURES_DIR = join(import.meta.dirname!, "fixtures", "build-test");

const siteMetadata: SiteMetadata = {
  baseUrl: "https://example.com",
  title: "Test Site",
  description: "A test site",
};

describe(
  "build - static site generation",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    afterAll(async () => {
      await stopBundleBuilder();
    });

    it("should build TSX pages to dist directory", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const indexPath = join(testOutputDir, "index.html");
      expect(await exists(indexPath)).toBe(true);
    });

    it("should build markdown pages to dist directory", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

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

    it("should include hydration bundle for TSX pages", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const indexPath = join(testOutputDir, "index.html");
      const html = await Deno.readTextFile(indexPath);

      // Should have __PAGE_PROPS__ script
      expect(html).toContain("window.__PAGE_PROPS__");
      // Should have bundle script tag
      expect(html).toContain("/__bundles/");
      expect(html).toContain('<script type="module"');
    });

    it("should include hydration bundle for markdown pages (for interactive layouts)", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const docsIntroPath = join(testOutputDir, "docs", "intro", "index.html");
      const html = await Deno.readTextFile(docsIntroPath);

      // Markdown pages also get hydration for interactive layouts
      expect(html).toContain("window.__PAGE_PROPS__");
      expect(html).toContain("/__bundles/");
      expect(html).toContain('<script type="module"');
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

    it("should generate _not-found.html from _not-found.tsx", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const notFoundPath = join(testOutputDir, "_not-found.html");
      expect(await exists(notFoundPath)).toBe(true);

      const html = await Deno.readTextFile(notFoundPath);
      expect(html).toContain("<title>Page Not Found</title>");
      expect(html).toContain("404 - Page Not Found");
    });

    it("should generate _error.html from _error.tsx", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      const errorPath = join(testOutputDir, "_error.html");
      expect(await exists(errorPath)).toBe(true);

      const html = await Deno.readTextFile(errorPath);
      expect(html).toContain("<title>Error</title>");
      expect(html).toContain("Something Went Wrong");
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

      expect(await exists(stalePath)).toBe(true);

      // Second build (should clean everything first)
      await build(siteMetadata, {
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      expect(await exists(stalePath)).toBe(false);
      expect(await exists(join(testOutputDir, "index.html"))).toBe(true);
    });
  },
);

describe(
  "build - sitemap generation",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    afterAll(async () => {
      await stopBundleBuilder();
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
  },
);

describe(
  "build - robots.txt generation",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    afterAll(async () => {
      await stopBundleBuilder();
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
  },
);

describe(
  "build - basePath validation",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    afterAll(async () => {
      await stopBundleBuilder();
    });

    it("should reject basePath without leading slash", async () => {
      await expect(
        build(
          { baseUrl: "https://example.com" },
          {
            rootDir: FIXTURES_DIR,
            outDir: await Deno.makeTempDir(),
            basePath: "docs",
          },
        ),
      ).rejects.toThrow("Invalid basePath");
    });

    it("should reject basePath with path traversal", async () => {
      await expect(
        build(
          { baseUrl: "https://example.com" },
          {
            rootDir: FIXTURES_DIR,
            outDir: await Deno.makeTempDir(),
            basePath: "/docs/../etc",
          },
        ),
      ).rejects.toThrow("path traversal not allowed");
    });

    it("should reject basePath with invalid characters", async () => {
      await expect(
        build(
          { baseUrl: "https://example.com" },
          {
            rootDir: FIXTURES_DIR,
            outDir: await Deno.makeTempDir(),
            basePath: "/docs?query=1",
          },
        ),
      ).rejects.toThrow("Invalid basePath");
    });
  },
);

describe(
  "build - basePath support",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    afterAll(async () => {
      await stopBundleBuilder();
    });

    it("should normalize basePath without trailing slash", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(
        { baseUrl: "https://example.com" },
        {
          rootDir: FIXTURES_DIR,
          outDir: testOutputDir,
          basePath: "/docs",
        },
      );

      const indexHtml = await Deno.readTextFile(
        join(testOutputDir, "index.html"),
      );
      expect(indexHtml).toContain("/docs/__bundles/");
    });

    it("should handle root basePath", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(
        { baseUrl: "https://example.com" },
        {
          rootDir: FIXTURES_DIR,
          outDir: testOutputDir,
          basePath: "/",
        },
      );

      const indexHtml = await Deno.readTextFile(
        join(testOutputDir, "index.html"),
      );
      expect(indexHtml).toContain("/__bundles/");
      expect(indexHtml).not.toContain("//__bundles/");
    });

    it("should default to root basePath when not specified", async () => {
      const testOutputDir = await Deno.makeTempDir();

      await build(
        { baseUrl: "https://example.com" },
        {
          rootDir: FIXTURES_DIR,
          outDir: testOutputDir,
        },
      );

      const indexHtml = await Deno.readTextFile(
        join(testOutputDir, "index.html"),
      );
      expect(indexHtml).toContain("/__bundles/");
    });
  },
);
