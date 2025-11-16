import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { generateNavigation } from "../navigation.ts";
import type { Frontmatter } from "../parser.ts";

describe("markdown-app - navigation", () => {
  describe("generateNavigation", () => {
    it("should generate structured navigation with sections", () => {
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

      expect(result.aside).toBeDefined();
      expect(result.aside).toHaveLength(1); // One section: "Guide"

      const guideSection = result.aside[0];
      expect(guideSection.title).toBe("Guide");
      expect(guideSection.items).toHaveLength(2);

      expect(guideSection.items[0].title).toBe("Getting Started");
      expect(guideSection.items[0].slug).toBe("guide/getting-started");
      expect(guideSection.items[0].href).toBe("/docs/guide/getting-started");
      expect(guideSection.items[0].isCurrent).toBe(true);

      expect(guideSection.items[1].title).toBe("Installation");
      expect(guideSection.items[1].slug).toBe("guide/installation");
      expect(guideSection.items[1].href).toBe("/docs/guide/installation");
      expect(guideSection.items[1].isCurrent).toBe(false);
    });

    it("should parse nav field with section/item format", () => {
      const pages: Frontmatter[] = [
        {
          title: "CORS",
          slug: "middleware/cors",
          layout: "docs",
          "nav-group": "aside",
          "nav-item": "Middleware/CORS",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "middleware/cors", "/");

      expect(result.aside).toBeDefined();
      expect(result.aside[0].title).toBe("Middleware");
      expect(result.aside[0].items[0].title).toBe("CORS");
    });

    it("should parse nav field without section", () => {
      const pages: Frontmatter[] = [
        {
          title: "Introduction",
          slug: "intro",
          layout: "docs",
          "nav-group": "aside",
          "nav-item": "Introduction",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "intro", "/");

      expect(result.aside).toBeDefined();
      expect(result.aside[0].title).toBe(""); // No section title
      expect(result.aside[0].items[0].title).toBe("Introduction");
    });

    it("should sort items by nav-order", () => {
      const pages: Frontmatter[] = [
        {
          title: "Third",
          slug: "third",
          layout: "docs",
          "nav-group": "default",
          "nav-item": "Third",
          "nav-order": 3,
        },
        {
          title: "First",
          slug: "first",
          layout: "docs",
          "nav-group": "default",
          "nav-item": "First",
          "nav-order": 1,
        },
        {
          title: "Second",
          slug: "second",
          layout: "docs",
          "nav-group": "default",
          "nav-item": "Second",
          "nav-order": 2,
        },
      ];

      const result = generateNavigation(pages, "first", "/");

      expect(result.default[0].items[0].title).toBe("First");
      expect(result.default[0].items[1].title).toBe("Second");
      expect(result.default[0].items[2].title).toBe("Third");
    });

    it("should sort items alphabetically when nav-order is the same", () => {
      const pages: Frontmatter[] = [
        {
          title: "Zebra",
          slug: "zebra",
          layout: "docs",
          "nav-group": "default",
          "nav-item": "Zebra",
          "nav-order": 1,
        },
        {
          title: "Apple",
          slug: "apple",
          layout: "docs",
          "nav-group": "default",
          "nav-item": "Apple",
          "nav-order": 1,
        },
        {
          title: "Mango",
          slug: "mango",
          layout: "docs",
          "nav-group": "default",
          "nav-item": "Mango",
          "nav-order": 1,
        },
      ];

      const result = generateNavigation(pages, "apple", "/");

      expect(result.default[0].items[0].title).toBe("Apple");
      expect(result.default[0].items[1].title).toBe("Mango");
      expect(result.default[0].items[2].title).toBe("Zebra");
    });

    it("should default nav-order to 999", () => {
      const pages: Frontmatter[] = [
        {
          title: "Has Order",
          slug: "has-order",
          layout: "docs",
          "nav-group": "default",
          "nav-item": "Has Order",
          "nav-order": 1,
        },
        {
          title: "No Order",
          slug: "no-order",
          layout: "docs",
          "nav-group": "default",
          "nav-item": "No Order",
        },
      ];

      const result = generateNavigation(pages, "has-order", "/");

      // Has Order (1) should come before No Order (999)
      expect(result.default[0].items[0].title).toBe("Has Order");
      expect(result.default[0].items[1].title).toBe("No Order");
    });

    it("should mark current page with isCurrent", () => {
      const pages: Frontmatter[] = [
        {
          title: "Page 1",
          slug: "page-1",
          layout: "docs",
          "nav-group": "default",
          "nav-item": "Page 1",
        },
        {
          title: "Page 2",
          slug: "page-2",
          layout: "docs",
          "nav-group": "default",
          "nav-item": "Page 2",
        },
      ];

      const result = generateNavigation(pages, "page-2", "/");

      expect(result.default[0].items[0].isCurrent).toBe(false);
      expect(result.default[0].items[1].isCurrent).toBe(true);
    });

    it("should group navigation by nav-group", () => {
      const pages: Frontmatter[] = [
        {
          title: "Sidebar Item",
          slug: "sidebar",
          layout: "docs",
          "nav-group": "aside",
          "nav-item": "Sidebar Item",
        },
        {
          title: "Header Item",
          slug: "header",
          layout: "docs",
          "nav-group": "header",
          "nav-item": "Header Item",
        },
      ];

      const result = generateNavigation(pages, "sidebar", "/");

      expect(result.aside).toBeDefined();
      expect(result.aside[0].items[0].title).toBe("Sidebar Item");

      expect(result.header).toBeDefined();
      expect(result.header[0].items[0].title).toBe("Header Item");
    });

    it("should handle multiple sections within a group", () => {
      const pages: Frontmatter[] = [
        {
          title: "Getting Started",
          slug: "getting-started",
          layout: "docs",
          "nav-group": "aside",
          "nav-item": "Guide/Getting Started",
          "nav-order": 1,
        },
        {
          title: "API Reference",
          slug: "api",
          layout: "docs",
          "nav-group": "aside",
          "nav-item": "Reference/API",
          "nav-order": 2,
        },
        {
          title: "Advanced Topics",
          slug: "advanced",
          layout: "docs",
          "nav-group": "aside",
          "nav-item": "Advanced/Topics",
          "nav-order": 3,
        },
      ];

      const result = generateNavigation(pages, "getting-started", "/");

      expect(result.aside).toHaveLength(3);
      expect(result.aside[0].title).toBe("Guide");
      expect(result.aside[1].title).toBe("Reference");
      expect(result.aside[2].title).toBe("Advanced");
    });

    it("should sort sections by lowest item order", () => {
      const pages: Frontmatter[] = [
        {
          title: "Advanced Item",
          slug: "advanced",
          layout: "docs",
          "nav-group": "aside",
          "nav-item": "Advanced/Item",
          "nav-order": 30,
        },
        {
          title: "Guide Item",
          slug: "guide",
          layout: "docs",
          "nav-group": "aside",
          "nav-item": "Guide/Item",
          "nav-order": 10,
        },
        {
          title: "Reference Item",
          slug: "reference",
          layout: "docs",
          "nav-group": "aside",
          "nav-item": "Reference/Item",
          "nav-order": 20,
        },
      ];

      const result = generateNavigation(pages, "guide", "/");

      // Sections sorted by lowest item order
      expect(result.aside[0].title).toBe("Guide"); // order 10
      expect(result.aside[1].title).toBe("Reference"); // order 20
      expect(result.aside[2].title).toBe("Advanced"); // order 30
    });

    it("should normalize basePath in href", () => {
      const pages: Frontmatter[] = [
        {
          title: "Test",
          slug: "test",
          layout: "docs",
          "nav-group": "default",
          "nav-item": "Test",
        },
      ];

      const result = generateNavigation(pages, "test", "/docs");

      expect(result.default[0].items[0].href).toBe("/docs/test");
    });

    it("should handle empty basePath", () => {
      const pages: Frontmatter[] = [
        {
          title: "Test",
          slug: "test",
          layout: "docs",
          "nav-group": "default",
          "nav-item": "Test",
        },
      ];

      const result = generateNavigation(pages, "test", "");

      expect(result.default[0].items[0].href).toBe("/test");
    });

    it("should ignore pages without nav-item", () => {
      const pages: Frontmatter[] = [
        {
          title: "With Nav",
          slug: "with-nav",
          layout: "docs",
          "nav-group": "default",
          "nav-item": "With Nav",
        },
        {
          title: "Without Nav",
          slug: "without-nav",
          layout: "docs",
        },
      ];

      const result = generateNavigation(pages, "with-nav", "/");

      expect(result.default).toHaveLength(1);
      expect(result.default[0].items).toHaveLength(1);
      expect(result.default[0].items[0].title).toBe("With Nav");
    });

    it("should use page title when nav-item has no item text", () => {
      const pages: Frontmatter[] = [
        {
          title: "My Page Title",
          slug: "my-page",
          layout: "docs",
          "nav-group": "default",
          "nav-item": "Section/",
        },
      ];

      const result = generateNavigation(pages, "my-page", "/");

      // Should fall back to page title
      expect(result.default[0].items[0].title).toBe("My Page Title");
    });

    it("should ignore pages with empty nav-item", () => {
      const pages: Frontmatter[] = [
        {
          title: "No Nav",
          slug: "no-nav",
          layout: "docs",
          "nav-item": "",
          "nav-group": "default",
        },
        {
          title: "With Nav",
          slug: "with-nav",
          layout: "docs",
          "nav-item": "Item",
          "nav-group": "default",
        },
      ];

      const result = generateNavigation(pages, "with-nav", "");

      // Empty nav-item is filtered out (truthy check)
      expect(result.default).toBeDefined();
      expect(result.default[0].items).toHaveLength(1);
      expect(result.default[0].items[0].slug).toBe("with-nav");
    });

    it("should fail when nav-item has too many slashes", () => {
      const pages: Frontmatter[] = [
        {
          title: "Bad Page",
          slug: "bad",
          layout: "docs",
          "nav-item": "Section/Item/Extra",
          "nav-group": "default",
        },
      ];

      expect(() => {
        generateNavigation(pages, "bad", "");
      }).toThrow("Invalid nav-item in bad");
    });

    it("should fail when nav-item is only slashes", () => {
      const pages: Frontmatter[] = [
        {
          title: "Bad Page",
          slug: "bad",
          layout: "docs",
          "nav-item": "///",
          "nav-group": "default",
        },
      ];

      expect(() => {
        generateNavigation(pages, "bad", "");
      }).toThrow("Invalid nav-item in bad");
    });
  });
});
