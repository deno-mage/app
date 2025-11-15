import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { generateSitemap } from "../sitemap.ts";
import type { Frontmatter } from "../parser.ts";

describe("markdown-app - sitemap", () => {
  describe("generateSitemap", () => {
    it("should generate basic sitemap with single page", () => {
      const pages: Frontmatter[] = [
        {
          title: "Home",
          slug: "index",
          layout: "docs",
        },
      ];

      const sitemap = generateSitemap(pages, "https://example.com", "/");

      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      );
      expect(sitemap).toContain("<loc>https://example.com</loc>");
    });

    it("should generate sitemap with multiple pages", () => {
      const pages: Frontmatter[] = [
        {
          title: "Home",
          slug: "index",
          layout: "docs",
        },
        {
          title: "About",
          slug: "about",
          layout: "docs",
        },
        {
          title: "Contact",
          slug: "contact",
          layout: "docs",
        },
      ];

      const sitemap = generateSitemap(pages, "https://example.com", "/");

      expect(sitemap).toContain("<loc>https://example.com</loc>");
      expect(sitemap).toContain("<loc>https://example.com/about</loc>");
      expect(sitemap).toContain("<loc>https://example.com/contact</loc>");
    });

    it("should include SEO metadata when provided", () => {
      const pages: Frontmatter[] = [
        {
          title: "Home",
          slug: "index",
          layout: "docs",
          lastmod: "2025-01-15",
          changefreq: "weekly",
          priority: 1.0,
        },
      ];

      const sitemap = generateSitemap(pages, "https://example.com", "/");

      expect(sitemap).toContain("<lastmod>2025-01-15</lastmod>");
      expect(sitemap).toContain("<changefreq>weekly</changefreq>");
      expect(sitemap).toContain("<priority>1.0</priority>");
    });

    it("should handle basePath correctly", () => {
      const pages: Frontmatter[] = [
        {
          title: "Home",
          slug: "index",
          layout: "docs",
        },
        {
          title: "Guide",
          slug: "guide",
          layout: "docs",
        },
      ];

      const sitemap = generateSitemap(pages, "https://example.com", "/docs");

      expect(sitemap).toContain("<loc>https://example.com/docs</loc>");
      expect(sitemap).toContain("<loc>https://example.com/docs/guide</loc>");
    });

    it("should normalize siteUrl by removing trailing slash", () => {
      const pages: Frontmatter[] = [
        {
          title: "Home",
          slug: "index",
          layout: "docs",
        },
      ];

      const sitemap = generateSitemap(pages, "https://example.com/", "/");

      expect(sitemap).toContain("<loc>https://example.com</loc>");
      expect(sitemap).not.toContain("https://example.com//");
    });

    it("should escape XML special characters in URLs", () => {
      const pages: Frontmatter[] = [
        {
          title: "Q&A",
          slug: "q&a",
          layout: "docs",
        },
      ];

      const sitemap = generateSitemap(pages, "https://example.com", "/");

      expect(sitemap).toContain("<loc>https://example.com/q&amp;a</loc>");
    });

    it("should handle nested slugs", () => {
      const pages: Frontmatter[] = [
        {
          title: "API Router",
          slug: "api/router",
          layout: "docs",
        },
      ];

      const sitemap = generateSitemap(pages, "https://example.com", "/");

      expect(sitemap).toContain("<loc>https://example.com/api/router</loc>");
    });

    it("should omit optional fields when not provided", () => {
      const pages: Frontmatter[] = [
        {
          title: "Home",
          slug: "index",
          layout: "docs",
        },
      ];

      const sitemap = generateSitemap(pages, "https://example.com", "/");

      expect(sitemap).not.toContain("<lastmod>");
      expect(sitemap).not.toContain("<changefreq>");
      expect(sitemap).not.toContain("<priority>");
    });

    it("should handle root slug variants (/, index, empty)", () => {
      const testCases = ["/", "index", ""];

      for (const slug of testCases) {
        const pages: Frontmatter[] = [
          {
            title: "Home",
            slug,
            layout: "docs",
          },
        ];

        const sitemap = generateSitemap(pages, "https://example.com", "/");
        expect(sitemap).toContain("<loc>https://example.com</loc>");
      }
    });
  });
});
