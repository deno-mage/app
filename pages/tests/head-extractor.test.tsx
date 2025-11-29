/**
 * Tests for head content extraction from SSR output.
 *
 * @module
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { extractHeadContent } from "../head-extractor.ts";

describe("Head Extractor", () => {
  describe("extractHeadContent", () => {
    it("should extract single head marker", () => {
      const html =
        "<div><mage-head><title>Test</title></mage-head><p>Content</p></div>";

      const result = extractHeadContent(html);

      expect(result.headContent).toBe("<title>Test</title>");
      expect(result.html).toBe("<div><p>Content</p></div>");
    });

    it("should extract multiple head markers and concatenate", () => {
      const html = `
        <div>
          <mage-head><link rel="stylesheet" href="/base.css"/></mage-head>
          <main>
            <mage-head><title>Page Title</title></mage-head>
            <p>Content</p>
          </main>
        </div>
      `;

      const result = extractHeadContent(html);

      expect(result.headContent).toContain(
        '<link rel="stylesheet" href="/base.css"/>',
      );
      expect(result.headContent).toContain("<title>Page Title</title>");
      expect(result.html).not.toContain("<mage-head");
      expect(result.html).toContain("<p>Content</p>");
    });

    it("should concatenate head content with newlines", () => {
      const html = `
        <mage-head><meta name="first"/></mage-head>
        <mage-head><meta name="second"/></mage-head>
      `;

      const result = extractHeadContent(html);

      expect(result.headContent).toBe(
        '<meta name="first"/>\n<meta name="second"/>',
      );
    });

    it("should return empty string when no markers present", () => {
      const html = "<div><p>No head markers here</p></div>";

      const result = extractHeadContent(html);

      expect(result.headContent).toBe("");
      expect(result.html).toBe(html);
    });

    it("should remove all markers from HTML", () => {
      const html = `
        <div>
          <mage-head><title>Test</title></mage-head>
          <p>Content</p>
          <mage-head><meta name="test"/></mage-head>
        </div>
      `;

      const result = extractHeadContent(html);

      expect(result.html).not.toContain("<mage-head");
      expect(result.html).not.toContain("</mage-head>");
      expect(result.html).toContain("<p>Content</p>");
    });

    it("should handle multiline content within marker", () => {
      const html = `
        <mage-head>
          <title>Test Page</title>
          <meta name="description" content="Test"/>
          <link rel="stylesheet" href="/styles.css"/>
        </mage-head>
        <div>Content</div>
      `;

      const result = extractHeadContent(html);

      expect(result.headContent).toContain("<title>Test Page</title>");
      expect(result.headContent).toContain(
        '<meta name="description" content="Test"/>',
      );
      expect(result.headContent).toContain(
        '<link rel="stylesheet" href="/styles.css"/>',
      );
      expect(result.html).not.toContain("<mage-head");
    });

    it("should handle complex nested HTML in marker", () => {
      const html = `
        <div>
          <mage-head>
            <style>
              body { margin: 0; }
              .container { max-width: 1200px; }
            </style>
          </mage-head>
          <p>Text</p>
        </div>
      `;

      const result = extractHeadContent(html);

      expect(result.headContent).toContain("<style>");
      expect(result.headContent).toContain("body { margin: 0; }");
      expect(result.html).not.toContain("<mage-head");
      expect(result.html).toContain("<p>Text</p>");
    });

    it("should handle script tags in marker", () => {
      const html = `
        <mage-head>
          <script src="/analytics.js"></script>
          <script>console.log('test');</script>
        </mage-head>
        <div>Content</div>
      `;

      const result = extractHeadContent(html);

      expect(result.headContent).toContain(
        '<script src="/analytics.js"></script>',
      );
      expect(result.headContent).toContain("console.log('test');");
    });

    it("should handle empty marker", () => {
      const html = "<div><mage-head></mage-head><p>Content</p></div>";

      const result = extractHeadContent(html);

      expect(result.headContent).toBe("");
      expect(result.html).toBe("<div><p>Content</p></div>");
    });

    it("should handle markers with whitespace", () => {
      const html = `
        <mage-head>

          <title>Test</title>

        </mage-head>
      `;

      const result = extractHeadContent(html);

      expect(result.headContent).toContain("<title>Test</title>");
    });

    it("should not modify non-marker content", () => {
      const html = `
        <div>
          <p>This is <strong>important</strong> content</p>
          <mage-head><title>Test</title></mage-head>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      `;

      const result = extractHeadContent(html);

      expect(result.html).toContain(
        "<p>This is <strong>important</strong> content</p>",
      );
      expect(result.html).toContain("<li>Item 1</li>");
      expect(result.html).toContain("<li>Item 2</li>");
    });

    it("should handle special characters in content", () => {
      const html = `
        <mage-head>
          <meta name="description" content="Testing & special < > characters"/>
        </mage-head>
        <p>Content</p>
      `;

      const result = extractHeadContent(html);

      expect(result.headContent).toContain("Testing & special < > characters");
    });

    it("should extract from real SSR output", () => {
      // Simulate actual render output
      const html = `
        <div class="layout">
          <mage-head><link rel="stylesheet" href="/base.css"/></mage-head>
          <header>
            <nav>Navigation</nav>
          </header>
          <main>
            <article>
              <mage-head>
                <title>Getting Started</title>
                <meta name="description" content="Learn how to get started"/>
              </mage-head>
              <h1>Getting Started</h1>
              <p>Welcome to our platform!</p>
            </article>
          </main>
        </div>
      `;

      const result = extractHeadContent(html);

      // Should extract both markers
      expect(result.headContent).toContain(
        '<link rel="stylesheet" href="/base.css"/>',
      );
      expect(result.headContent).toContain("<title>Getting Started</title>");
      expect(result.headContent).toContain(
        '<meta name="description" content="Learn how to get started"/>',
      );

      // Should remove markers from HTML
      expect(result.html).not.toContain("<mage-head");

      // Should preserve structure
      expect(result.html).toContain("<header>");
      expect(result.html).toContain("<nav>Navigation</nav>");
      expect(result.html).toContain("<h1>Getting Started</h1>");
    });

    it("should maintain order of extracted content", () => {
      const html = `
        <mage-head><meta name="first"/></mage-head>
        <mage-head><meta name="second"/></mage-head>
        <mage-head><meta name="third"/></mage-head>
      `;

      const result = extractHeadContent(html);

      const lines = result.headContent.split("\n");
      expect(lines[0]).toContain('name="first"');
      expect(lines[1]).toContain('name="second"');
      expect(lines[2]).toContain('name="third"');
    });
  });

  describe("edge cases", () => {
    it("should handle empty HTML string", () => {
      const result = extractHeadContent("");

      expect(result.headContent).toBe("");
      expect(result.html).toBe("");
    });

    it("should handle HTML with only markers", () => {
      const html = "<mage-head><title>Only Title</title></mage-head>";

      const result = extractHeadContent(html);

      expect(result.headContent).toBe("<title>Only Title</title>");
      expect(result.html).toBe("");
    });

    it("should handle markers at different nesting levels", () => {
      const html = `
        <div>
          <mage-head><meta name="top"/></mage-head>
          <div>
            <div>
              <mage-head><meta name="nested"/></mage-head>
            </div>
          </div>
        </div>
      `;

      const result = extractHeadContent(html);

      expect(result.headContent).toContain('<meta name="top"/>');
      expect(result.headContent).toContain('<meta name="nested"/>');
    });
  });
});
