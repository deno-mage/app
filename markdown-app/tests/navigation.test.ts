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
          "nav-group": "aside",
          "nav-item": "Guide/Getting Started",
          "nav-order": 1,
        },
        {
          title: "Installation",
          slug: "guide/installation",
          layout: "docs",
          "nav-group": "aside",
          "nav-item": "Guide/Installation",
          "nav-order": 2,
        },
      ];

      const result = generateNavigation(
        pages,
        "guide/getting-started",
        "/docs",
      );

      expect(result.aside).toContain("<nav>");
      expect(result.aside).toContain("<section>");
      expect(result.aside).toContain("<h3>Guide</h3>");
      expect(result.aside).toContain(
        '<a href="/docs/guide/getting-started" data-current="true">Getting Started</a>',
      );
      expect(result.aside).toContain(
        '<a href="/docs/guide/installation">Installation</a>',
      );
    });

    it("should parse nav field with section/item format", () => {
      const pages: Frontmatter[] = [
        {
          title: "CORS",
          slug: "middleware/cors",
          layout: "docs",
          "nav-item": "Middleware/CORS",
          "nav-group": "default",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      expect(result.default).toContain("<h3>Middleware</h3>");
      expect(result.default).toContain('<a href="/middleware/cors">CORS</a>');
    });

    it("should parse nav field without section", () => {
      const pages: Frontmatter[] = [
        {
          title: "Introduction",
          slug: "intro",
          layout: "docs",
          "nav-item": "Introduction",
          "nav-group": "default",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      expect(result.default).not.toContain("<section>");
      expect(result.default).not.toContain("<h3>");
      expect(result.default).toContain('<a href="/intro">Introduction</a>');
    });

    it("should use page title when nav item not specified", () => {
      const pages: Frontmatter[] = [
        {
          title: "My Page Title",
          slug: "my-page",
          layout: "docs",
          "nav-item": "My Page Title",
          "nav-group": "default",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      expect(result.default).toContain("My Page Title");
    });

    it("should sort items by nav-order", () => {
      const pages: Frontmatter[] = [
        {
          title: "Third",
          slug: "third",
          layout: "docs",
          "nav-item": "Third",
          "nav-group": "default",
          "nav-order": 3,
        },
        {
          title: "First",
          slug: "first",
          layout: "docs",
          "nav-item": "First",
          "nav-group": "default",
          "nav-order": 1,
        },
        {
          title: "Second",
          slug: "second",
          layout: "docs",
          "nav-item": "Second",
          "nav-group": "default",
          "nav-order": 2,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      const firstIndex = result.default.indexOf('href="/first"');
      const secondIndex = result.default.indexOf('href="/second"');
      const thirdIndex = result.default.indexOf('href="/third"');

      expect(firstIndex).toBeLessThan(secondIndex);
      expect(secondIndex).toBeLessThan(thirdIndex);
    });

    it("should sort alphabetically when nav-order is same", () => {
      const pages: Frontmatter[] = [
        {
          title: "Zebra",
          slug: "zebra",
          layout: "docs",
          "nav-item": "Zebra",
          "nav-group": "default",
          "nav-order": 1,
        },
        {
          title: "Apple",
          slug: "apple",
          layout: "docs",
          "nav-item": "Apple",
          "nav-group": "default",
          "nav-order": 1,
        },
        {
          title: "Mango",
          slug: "mango",
          layout: "docs",
          "nav-item": "Mango",
          "nav-group": "default",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      const appleIndex = result.default.indexOf('href="/apple"');
      const mangoIndex = result.default.indexOf('href="/mango"');
      const zebraIndex = result.default.indexOf('href="/zebra"');

      expect(appleIndex).toBeLessThan(mangoIndex);
      expect(mangoIndex).toBeLessThan(zebraIndex);
    });

    it("should default to nav-order 999 when not specified", () => {
      const pages: Frontmatter[] = [
        {
          title: "Has Order",
          slug: "has-order",
          layout: "docs",
          "nav-item": "Has Order",
          "nav-group": "default",
          "nav-order": 1,
        },
        {
          title: "No Order",
          slug: "no-order",
          layout: "docs",
          "nav-item": "No Order",
          "nav-group": "default",
        },
      ];

      const result = generateNavigation(pages, "", "/");

      const hasOrderIndex = result.default.indexOf('href="/has-order"');
      const noOrderIndex = result.default.indexOf('href="/no-order"');

      // Item with explicit order should come first
      expect(hasOrderIndex).toBeLessThan(noOrderIndex);
    });

    it("should mark current page with data-current attribute", () => {
      const pages: Frontmatter[] = [
        {
          title: "Page 1",
          slug: "page1",
          layout: "docs",
          "nav-item": "Page 1",
          "nav-group": "default",
          "nav-order": 1,
        },
        {
          title: "Page 2",
          slug: "page2",
          layout: "docs",
          "nav-item": "Page 2",
          "nav-group": "default",
          "nav-order": 2,
        },
      ];

      const result = generateNavigation(pages, "page1", "/");

      expect(result.default).toContain(
        '<a href="/page1" data-current="true">Page 1</a>',
      );
      expect(result.default).toContain('<a href="/page2">Page 2</a>');
      expect(result.default).not.toContain('data-current="true">Page 2');
    });

    it("should handle basePath in URLs", () => {
      const pages: Frontmatter[] = [
        {
          title: "Guide",
          slug: "guide",
          layout: "docs",
          "nav-item": "Guide",
          "nav-group": "default",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/docs");

      expect(result.default).toContain('<a href="/docs/guide">');
    });

    it("should handle root basePath", () => {
      const pages: Frontmatter[] = [
        {
          title: "Guide",
          slug: "guide",
          layout: "docs",
          "nav-item": "Guide",
          "nav-group": "default",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      expect(result.default).toContain('<a href="/guide">');
      expect(result.default).not.toContain('href="//guide"');
    });

    it("should filter out pages without nav field", () => {
      const pages: Frontmatter[] = [
        {
          title: "Has Nav",
          slug: "has-nav",
          layout: "docs",
          "nav-item": "Has Nav",
          "nav-group": "default",
          "nav-order": 1,
        },
        {
          title: "No Nav",
          slug: "no-nav",
          layout: "docs",
        },
      ];

      const result = generateNavigation(pages, "", "/");

      expect(result.default).toContain("Has Nav");
      expect(result.default).not.toContain("No Nav");
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

      expect(Object.keys(result).length).toBe(0);
    });

    it("should return empty nav when pages array is empty", () => {
      const pages: Frontmatter[] = [];

      const result = generateNavigation(pages, "", "/");

      expect(Object.keys(result).length).toBe(0);
    });

    it("should group multiple items in same section", () => {
      const pages: Frontmatter[] = [
        {
          title: "CORS",
          slug: "middleware/cors",
          layout: "docs",
          "nav-item": "Middleware/CORS",
          "nav-group": "default",
          "nav-order": 1,
        },
        {
          title: "Logger",
          slug: "middleware/logger",
          layout: "docs",
          "nav-item": "Middleware/Logger",
          "nav-group": "default",
          "nav-order": 2,
        },
        {
          title: "Body Parser",
          slug: "middleware/body-parser",
          layout: "docs",
          "nav-item": "Middleware/Body Parser",
          "nav-group": "default",
          "nav-order": 3,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      // Should have one section
      const sectionMatches = result.default.match(/<section>/g);
      expect(sectionMatches?.length).toBe(1);

      // Should have all three items
      expect(result.default).toContain("CORS");
      expect(result.default).toContain("Logger");
      expect(result.default).toContain("Body Parser");
    });

    it("should sort sections by lowest item order", () => {
      const pages: Frontmatter[] = [
        {
          title: "Advanced Topic",
          slug: "advanced",
          layout: "docs",
          "nav-item": "Advanced/Advanced Topic",
          "nav-group": "default",
          "nav-order": 10,
        },
        {
          title: "Getting Started",
          slug: "guide",
          layout: "docs",
          "nav-item": "Guide/Getting Started",
          "nav-group": "default",
          "nav-order": 1,
        },
        {
          title: "API Reference",
          slug: "api",
          layout: "docs",
          "nav-item": "Reference/API Reference",
          "nav-group": "default",
          "nav-order": 5,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      const guideIndex = result.default.indexOf("<h3>Guide</h3>");
      const referenceIndex = result.default.indexOf("<h3>Reference</h3>");
      const advancedIndex = result.default.indexOf("<h3>Advanced</h3>");

      expect(guideIndex).toBeLessThan(referenceIndex);
      expect(referenceIndex).toBeLessThan(advancedIndex);
    });

    it("should handle mixed sectioned and unsectioned items", () => {
      const pages: Frontmatter[] = [
        {
          title: "Introduction",
          slug: "intro",
          layout: "docs",
          "nav-item": "Introduction",
          "nav-group": "default",
          "nav-order": 1,
        },
        {
          title: "Getting Started",
          slug: "guide/getting-started",
          layout: "docs",
          "nav-item": "Guide/Getting Started",
          "nav-group": "default",
          "nav-order": 2,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      // Should have both unsectioned list and sectioned content
      expect(result.default).toContain("Introduction");
      expect(result.default).toContain("<h3>Guide</h3>");
      expect(result.default).toContain("Getting Started");
    });

    it("should handle nav field with extra whitespace", () => {
      const pages: Frontmatter[] = [
        {
          title: "Guide",
          slug: "guide",
          layout: "docs",
          "nav-item": "  Guide Section  /  Getting Started  ",
          "nav-group": "default",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      expect(result.default).toContain("<h3>Guide Section</h3>");
      expect(result.default).toContain("Getting Started");
    });

    it("should handle nested slugs in URLs", () => {
      const pages: Frontmatter[] = [
        {
          title: "Router",
          slug: "api/router",
          layout: "docs",
          "nav-item": "API/Router",
          "nav-group": "default",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/docs");

      expect(result.default).toContain('<a href="/docs/api/router">');
    });

    it("should produce semantic HTML structure", () => {
      const pages: Frontmatter[] = [
        {
          title: "Item 1",
          slug: "item1",
          layout: "docs",
          "nav-item": "Section/Item 1",
          "nav-group": "default",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "", "/");

      expect(result.default).toMatch(/<nav>/);
      expect(result.default).toMatch(/<section>/);
      expect(result.default).toMatch(/<h3>Section<\/h3>/);
      expect(result.default).toMatch(/<ul>/);
      expect(result.default).toMatch(/<li>/);
      expect(result.default).toMatch(/<a href="[^"]*">/);
      expect(result.default).toMatch(/<\/a><\/li>/);
      expect(result.default).toMatch(/<\/ul>/);
      expect(result.default).toMatch(/<\/section>/);
      expect(result.default).toMatch(/<\/nav>/);
    });
  });
});
