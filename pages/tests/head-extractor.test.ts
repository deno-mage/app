import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { extractHead } from "../head-extractor.ts";

describe("head-extractor - single Head component", () => {
  it("should extract head content from single Head component", () => {
    const html = `<div>
      <head data-mage-head="true">
        <title>Test Page</title>
        <meta name="description" content="Test description" />
      </head>
      <main>Content here</main>
    </div>`;

    const result = extractHead(html);

    expect(result.headContent).toContain("<title>Test Page</title>");
    expect(result.headContent).toContain(
      '<meta name="description" content="Test description" />',
    );
    expect(result.bodyContent).not.toContain("data-mage-head");
    expect(result.bodyContent).toContain("<main>Content here</main>");
  });

  it("should handle head with newlines and formatting", () => {
    const html = `<div>
      <head data-mage-head="true">
        <title>My Title</title>
        <meta charset="UTF-8" />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>Body content</body>
    </div>`;

    const result = extractHead(html);

    expect(result.headContent).toContain("<title>My Title</title>");
    expect(result.headContent).toContain('<meta charset="UTF-8" />');
    expect(result.headContent).toContain(
      '<link rel="stylesheet" href="/styles.css" />',
    );
  });

  it("should preserve whitespace in head content", () => {
    const html = `<head data-mage-head="true">
      <title>Test</title>
    </head>`;

    const result = extractHead(html);

    expect(result.headContent).toContain("\n      <title>Test</title>\n    ");
  });
});

describe("head-extractor - multiple Head components", () => {
  it("should extract and concatenate multiple Head components", () => {
    const html = `<div>
      <head data-mage-head="true">
        <title>Test Page</title>
      </head>
      <main>
        <head data-mage-head="true">
          <meta name="author" content="John" />
        </head>
        Content
      </main>
    </div>`;

    const result = extractHead(html);

    expect(result.headContent).toContain("<title>Test Page</title>");
    expect(result.headContent).toContain(
      '<meta name="author" content="John" />',
    );
    expect(result.bodyContent).not.toContain("data-mage-head");
    expect(result.bodyContent).toContain("<main>");
    expect(result.bodyContent).toContain("Content");
  });

  it("should concatenate head content with newlines", () => {
    const html = `
      <head data-mage-head="true"><title>First</title></head>
      <head data-mage-head="true"><title>Second</title></head>
    `;

    const result = extractHead(html);

    expect(result.headContent).toContain("<title>First</title>");
    expect(result.headContent).toContain("<title>Second</title>");
    expect(result.headContent).toContain("\n");
  });

  it("should remove all Head markers from body", () => {
    const html = `
      <div>
        <head data-mage-head="true"><title>One</title></head>
        <p>Content 1</p>
        <head data-mage-head="true"><meta name="test" /></head>
        <p>Content 2</p>
      </div>
    `;

    const result = extractHead(html);

    expect(result.bodyContent).toContain("<p>Content 1</p>");
    expect(result.bodyContent).toContain("<p>Content 2</p>");
    expect(result.bodyContent).not.toContain("<head");
    expect(result.bodyContent).not.toContain("</head>");
    expect(result.bodyContent).not.toContain("data-mage-head");
  });
});

describe("head-extractor - no Head component", () => {
  it("should return empty head content when no Head component", () => {
    const html = `<div>
      <main>Just body content</main>
    </div>`;

    const result = extractHead(html);

    expect(result.headContent).toBe("");
    expect(result.bodyContent).toBe(html);
  });

  it("should handle empty HTML", () => {
    const html = "";

    const result = extractHead(html);

    expect(result.headContent).toBe("");
    expect(result.bodyContent).toBe("");
  });

  it("should not extract regular head tags without marker", () => {
    const html = `<html>
      <head>
        <title>Regular head</title>
      </head>
      <body>Content</body>
    </html>`;

    const result = extractHead(html);

    expect(result.headContent).toBe("");
    expect(result.bodyContent).toContain("<title>Regular head</title>");
  });
});

describe("head-extractor - edge cases", () => {
  it("should handle head with nested elements", () => {
    const html = `<head data-mage-head="true">
      <title>Test</title>
      <script>
        const data = { key: "value" };
      </script>
    </head>`;

    const result = extractHead(html);

    expect(result.headContent).toContain("<title>Test</title>");
    expect(result.headContent).toContain("<script>");
    expect(result.headContent).toContain('const data = { key: "value" };');
  });

  it("should handle head with special characters", () => {
    const html = `<head data-mage-head="true">
      <meta property="og:title" content="Test & Demo" />
      <meta name="description" content="Text with <special> chars" />
    </head>`;

    const result = extractHead(html);

    expect(result.headContent).toContain('content="Test & Demo"');
    expect(result.headContent).toContain('content="Text with <special> chars"');
  });

  it("should handle head at different nesting levels", () => {
    const html = `<div>
      <div>
        <div>
          <head data-mage-head="true">
            <title>Nested</title>
          </head>
        </div>
      </div>
    </div>`;

    const result = extractHead(html);

    expect(result.headContent).toContain("<title>Nested</title>");
    expect(result.bodyContent).not.toContain("data-mage-head");
  });

  it("should handle empty Head component", () => {
    const html = `<div>
      <head data-mage-head="true"></head>
      <main>Content</main>
    </div>`;

    const result = extractHead(html);

    expect(result.headContent).toBe("");
    expect(result.bodyContent).toContain("<main>Content</main>");
    expect(result.bodyContent).not.toContain("data-mage-head");
  });
});
