/**
 * Tests for HTML/XML utility functions.
 *
 * @module
 */

import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { escapeHtmlAttr, escapeXml } from "../html-utils.ts";

describe("escapeXml", () => {
  it("should escape ampersands", () => {
    expect(escapeXml("foo & bar")).toBe("foo &amp; bar");
  });

  it("should escape double quotes", () => {
    expect(escapeXml('foo "bar" baz')).toBe("foo &quot;bar&quot; baz");
  });

  it("should escape single quotes", () => {
    expect(escapeXml("foo 'bar' baz")).toBe("foo &apos;bar&apos; baz");
  });

  it("should escape less than", () => {
    expect(escapeXml("foo < bar")).toBe("foo &lt; bar");
  });

  it("should escape greater than", () => {
    expect(escapeXml("foo > bar")).toBe("foo &gt; bar");
  });

  it("should escape all special characters together", () => {
    expect(escapeXml("<script>\"alert('xss')&\"</script>")).toBe(
      "&lt;script&gt;&quot;alert(&apos;xss&apos;)&amp;&quot;&lt;/script&gt;",
    );
  });

  it("should return empty string unchanged", () => {
    expect(escapeXml("")).toBe("");
  });

  it("should return safe strings unchanged", () => {
    expect(escapeXml("hello-world_123")).toBe("hello-world_123");
  });

  it("should handle URL paths correctly", () => {
    expect(escapeXml("https://example.com/path?query=value")).toBe(
      "https://example.com/path?query=value",
    );
  });
});

describe("escapeHtmlAttr", () => {
  it("should be an alias for escapeXml", () => {
    expect(escapeHtmlAttr).toBe(escapeXml);
  });

  it("should escape for HTML attribute context", () => {
    expect(escapeHtmlAttr("/__styles/uno-abc123.css")).toBe(
      "/__styles/uno-abc123.css",
    );
  });
});
