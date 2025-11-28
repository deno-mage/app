/**
 * Tests for MarkdownPage component.
 *
 * @module
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { render } from "preact-render-to-string";
import { MarkdownPage } from "../markdown-page.tsx";

describe("MarkdownPage", () => {
  it("should render HTML content in a div", () => {
    const html = "<h1>Title</h1><p>Content</p>";
    const result = render(<MarkdownPage html={html} />);

    expect(result).toContain("<div>");
    expect(result).toContain("<h1>Title</h1>");
    expect(result).toContain("<p>Content</p>");
    expect(result).toContain("</div>");
  });

  it("should preserve complex HTML structure", () => {
    const html = `
      <h1>Getting Started</h1>
      <p>This is <strong>bold</strong> and <em>italic</em>.</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
      <pre><code>const x = 1;</code></pre>
    `;
    const result = render(<MarkdownPage html={html} />);

    expect(result).toContain("<strong>bold</strong>");
    expect(result).toContain("<em>italic</em>");
    expect(result).toContain("<li>Item 1</li>");
    expect(result).toContain("<pre><code>const x = 1;</code></pre>");
  });

  it("should handle empty HTML", () => {
    const result = render(<MarkdownPage html="" />);

    expect(result).toBe("<div></div>");
  });

  it("should handle HTML with special characters", () => {
    const html = "<p>Code: &lt;div&gt; &amp; &quot;quotes&quot;</p>";
    const result = render(<MarkdownPage html={html} />);

    expect(result).toContain("&lt;div&gt;");
    expect(result).toContain("&amp;");
  });

  it("should wrap content in single div", () => {
    const html = "<h1>Title</h1><p>Para 1</p><p>Para 2</p>";
    const result = render(<MarkdownPage html={html} />);

    // Should have exactly one wrapping div
    expect(result.startsWith("<div>")).toBe(true);
    expect(result.endsWith("</div>")).toBe(true);

    // Remove outer div and check content is not double-wrapped
    const inner = result.slice(5, -6);
    expect(inner.startsWith("<div>")).toBe(false);
  });
});
