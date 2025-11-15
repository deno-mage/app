import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { generateNavigation } from "../navigation.ts";
import type { Frontmatter } from "../parser.ts";

describe("markdown-app - navigation", () => {
  describe("generateNavigation", () => {
    it("should generate navigation with sections", () => {
      const pages: Frontmatter[] = [
        {
          title: "Getting Started",
          slug: "guide/getting-started",
          layout: "docs",
          nav: "Guide/Getting Started",
          "nav-order": 1,
        },
        {
          title: "Installation",
          slug: "guide/installation",
          layout: "docs",
          nav: "Guide/Installation",
          "nav-order": 2,
        },
      ];

      const result = generateNavigation(
        pages,
        "guide/getting-started",
        "/docs",
      );

      expect(result).toContain("<nav>");
      expect(result).toContain("<section>");
      expect(result).toContain("<h3>Guide</h3>");
      expect(result).toContain(
        '<a href="/docs/guide/getting-started" data-current="true">Getting Started</a>',
      );
      expect(result).toContain(
        '<a href="/docs/guide/installation">Installation</a>',
      );
    });

    it("should parse nav field with section/item format", () => {
      const pages: Frontmatter[] = [
        {
          title: "CORS",
          slug: "middleware/cors",
          layout: "docs",
          nav: "Middleware/CORS",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      expect(result).toContain("<h3>Middleware</h3>");
      expect(result).toContain('<a href="/middleware/cors">CORS</a>');
    });

    it("should parse nav field without section", () => {
      const pages: Frontmatter[] = [
        {
          title: "Introduction",
          slug: "intro",
          layout: "docs",
          nav: "Introduction",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      expect(result).not.toContain("<section>");
      expect(result).not.toContain("<h3>");
      expect(result).toContain('<a href="/intro">Introduction</a>');
    });

    it("should use page title when nav item not specified", () => {
      const pages: Frontmatter[] = [
        {
          title: "My Page Title",
          slug: "my-page",
          layout: "docs",
          nav: "My Page Title",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      expect(result).toContain("My Page Title");
    });

    it("should sort items by nav-order", () => {
      const pages: Frontmatter[] = [
        {
          title: "Third",
          slug: "third",
          layout: "docs",
          nav: "Third",
          "nav-order": 3,
        },
        {
          title: "First",
          slug: "first",
          layout: "docs",
          nav: "First",
          "nav-order": 1,
        },
        {
          title: "Second",
          slug: "second",
          layout: "docs",
          nav: "Second",
          "nav-order": 2,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      const firstIndex = result.indexOf('href="/first"');
      const secondIndex = result.indexOf('href="/second"');
      const thirdIndex = result.indexOf('href="/third"');

      expect(firstIndex).toBeLessThan(secondIndex);
      expect(secondIndex).toBeLessThan(thirdIndex);
    });

    it("should sort alphabetically when nav-order is same", () => {
      const pages: Frontmatter[] = [
        {
          title: "Zebra",
          slug: "zebra",
          layout: "docs",
          nav: "Zebra",
          "nav-order": 1,
        },
        {
          title: "Apple",
          slug: "apple",
          layout: "docs",
          nav: "Apple",
          "nav-order": 1,
        },
        {
          title: "Mango",
          slug: "mango",
          layout: "docs",
          nav: "Mango",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      const appleIndex = result.indexOf('href="/apple"');
      const mangoIndex = result.indexOf('href="/mango"');
      const zebraIndex = result.indexOf('href="/zebra"');

      expect(appleIndex).toBeLessThan(mangoIndex);
      expect(mangoIndex).toBeLessThan(zebraIndex);
    });

    it("should default to nav-order 999 when not specified", () => {
      const pages: Frontmatter[] = [
        {
          title: "Has Order",
          slug: "has-order",
          layout: "docs",
          nav: "Has Order",
          "nav-order": 1,
        },
        {
          title: "No Order",
          slug: "no-order",
          layout: "docs",
          nav: "No Order",
        },
      ];

      const result = generateNavigation(pages, "", "/");

      const hasOrderIndex = result.indexOf('href="/has-order"');
      const noOrderIndex = result.indexOf('href="/no-order"');

      // Item with explicit order should come first
      expect(hasOrderIndex).toBeLessThan(noOrderIndex);
    });

    it("should mark current page with data-current attribute", () => {
      const pages: Frontmatter[] = [
        {
          title: "Page 1",
          slug: "page1",
          layout: "docs",
          nav: "Page 1",
          "nav-order": 1,
        },
        {
          title: "Page 2",
          slug: "page2",
          layout: "docs",
          nav: "Page 2",
          "nav-order": 2,
        },
      ];

      const result = generateNavigation(pages, "page1", "/");

      expect(result).toContain(
        '<a href="/page1" data-current="true">Page 1</a>',
      );
      expect(result).toContain('<a href="/page2">Page 2</a>');
      expect(result).not.toContain('data-current="true">Page 2');
    });

    it("should handle basePath in URLs", () => {
      const pages: Frontmatter[] = [
        {
          title: "Guide",
          slug: "guide",
          layout: "docs",
          nav: "Guide",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/docs");

      expect(result).toContain('<a href="/docs/guide">');
    });

    it("should handle root basePath", () => {
      const pages: Frontmatter[] = [
        {
          title: "Guide",
          slug: "guide",
          layout: "docs",
          nav: "Guide",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      expect(result).toContain('<a href="/guide">');
      expect(result).not.toContain('href="//guide"');
    });

    it("should filter out pages without nav field", () => {
      const pages: Frontmatter[] = [
        {
          title: "Has Nav",
          slug: "has-nav",
          layout: "docs",
          nav: "Has Nav",
          "nav-order": 1,
        },
        {
          title: "No Nav",
          slug: "no-nav",
          layout: "docs",
        },
      ];

      const result = generateNavigation(pages, "", "/");

      expect(result).toContain("Has Nav");
      expect(result).not.toContain("No Nav");
    });

    it("should return empty nav when no pages have nav field", () => {
      const pages: Frontmatter[] = [
        {
          title: "Page 1",
          slug: "page1",
          layout: "docs",
        },
        {
          title: "Page 2",
          slug: "page2",
          layout: "docs",
        },
      ];

      const result = generateNavigation(pages, "", "/");

      expect(result).toBe("<nav></nav>");
    });

    it("should return empty nav when pages array is empty", () => {
      const pages: Frontmatter[] = [];

      const result = generateNavigation(pages, "", "/");

      expect(result).toBe("<nav></nav>");
    });

    it("should group multiple items in same section", () => {
      const pages: Frontmatter[] = [
        {
          title: "CORS",
          slug: "middleware/cors",
          layout: "docs",
          nav: "Middleware/CORS",
          "nav-order": 1,
        },
        {
          title: "Logger",
          slug: "middleware/logger",
          layout: "docs",
          nav: "Middleware/Logger",
          "nav-order": 2,
        },
        {
          title: "Body Parser",
          slug: "middleware/body-parser",
          layout: "docs",
          nav: "Middleware/Body Parser",
          "nav-order": 3,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      // Should have one section
      const sectionMatches = result.match(/<section>/g);
      expect(sectionMatches?.length).toBe(1);

      // Should have all three items
      expect(result).toContain("CORS");
      expect(result).toContain("Logger");
      expect(result).toContain("Body Parser");
    });

    it("should sort sections by lowest item order", () => {
      const pages: Frontmatter[] = [
        {
          title: "Advanced Topic",
          slug: "advanced",
          layout: "docs",
          nav: "Advanced/Advanced Topic",
          "nav-order": 10,
        },
        {
          title: "Getting Started",
          slug: "guide",
          layout: "docs",
          nav: "Guide/Getting Started",
          "nav-order": 1,
        },
        {
          title: "API Reference",
          slug: "api",
          layout: "docs",
          nav: "Reference/API Reference",
          "nav-order": 5,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      const guideIndex = result.indexOf("<h3>Guide</h3>");
      const referenceIndex = result.indexOf("<h3>Reference</h3>");
      const advancedIndex = result.indexOf("<h3>Advanced</h3>");

      expect(guideIndex).toBeLessThan(referenceIndex);
      expect(referenceIndex).toBeLessThan(advancedIndex);
    });

    it("should handle mixed sectioned and unsectioned items", () => {
      const pages: Frontmatter[] = [
        {
          title: "Introduction",
          slug: "intro",
          layout: "docs",
          nav: "Introduction",
          "nav-order": 1,
        },
        {
          title: "Getting Started",
          slug: "guide/getting-started",
          layout: "docs",
          nav: "Guide/Getting Started",
          "nav-order": 2,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      // Should have both unsectioned list and sectioned content
      expect(result).toContain("Introduction");
      expect(result).toContain("<h3>Guide</h3>");
      expect(result).toContain("Getting Started");
    });

    it("should handle nav field with extra whitespace", () => {
      const pages: Frontmatter[] = [
        {
          title: "Guide",
          slug: "guide",
          layout: "docs",
          nav: "  Guide Section  /  Getting Started  ",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      expect(result).toContain("<h3>Guide Section</h3>");
      expect(result).toContain("Getting Started");
    });

    it("should handle nested slugs in URLs", () => {
      const pages: Frontmatter[] = [
        {
          title: "Router",
          slug: "api/router",
          layout: "docs",
          nav: "API/Router",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/docs");

      expect(result).toContain('<a href="/docs/api/router">');
    });

    it("should produce semantic HTML structure", () => {
      const pages: Frontmatter[] = [
        {
          title: "Item 1",
          slug: "item1",
          layout: "docs",
          nav: "Section/Item 1",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      expect(result).toMatch(/<nav>/);
      expect(result).toMatch(/<section>/);
      expect(result).toMatch(/<h3>Section<\/h3>/);
      expect(result).toMatch(/<ul>/);
      expect(result).toMatch(/<li>/);
      expect(result).toMatch(/<a href="[^"]*">/);
      expect(result).toMatch(/<\/a><\/li>/);
      expect(result).toMatch(/<\/ul>/);
      expect(result).toMatch(/<\/section>/);
      expect(result).toMatch(/<\/nav>/);
    });
  });
});
