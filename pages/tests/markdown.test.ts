import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { parseAndRender, parseFrontmatter, renderToHtml } from "../markdown.ts";

describe("markdown - frontmatter parsing", () => {
  it("should parse valid frontmatter", () => {
    const markdown = `---
title: Test Page
description: A test page
layout: article
---

# Hello World`;

    const result = parseFrontmatter(markdown);

    expect(result.frontmatter.title).toBe("Test Page");
    expect(result.frontmatter.description).toBe("A test page");
    expect(result.frontmatter.layout).toBe("article");
    expect(result.content).toBe("# Hello World");
  });

  it("should parse frontmatter with custom fields", () => {
    const markdown = `---
title: Test
author: John Doe
tags:
  - javascript
  - testing
draft: true
---

Content here`;

    const result = parseFrontmatter(markdown);

    expect(result.frontmatter.title).toBe("Test");
    expect(result.frontmatter.author).toBe("John Doe");
    expect(result.frontmatter.tags).toEqual(["javascript", "testing"]);
    expect(result.frontmatter.draft).toBe(true);
  });

  it("should handle markdown without frontmatter", () => {
    const markdown = `# Just markdown

No frontmatter here.`;

    const result = parseFrontmatter(markdown);

    expect(result.frontmatter.title).toBe("");
    expect(result.content).toBe(markdown);
  });

  it("should fail when frontmatter YAML is invalid", () => {
    const markdown = `---
title: Test
invalid: [unclosed
---

Content`;

    expect(() => {
      parseFrontmatter(markdown);
    }).toThrow("Invalid frontmatter YAML");
  });

  it("should fail when title is missing", () => {
    const markdown = `---
description: Missing title
---

Content`;

    expect(() => {
      parseFrontmatter(markdown);
    }).toThrow("Frontmatter must include a 'title' field");
  });

  it("should fail when title is not a string", () => {
    const markdown = `---
title: 123
---

Content`;

    expect(() => {
      parseFrontmatter(markdown);
    }).toThrow("Frontmatter must include a 'title' field");
  });

  it("should fail when title is an empty string", () => {
    const markdown = `---
title: ""
---

Content`;

    expect(() => {
      parseFrontmatter(markdown);
    }).toThrow("Frontmatter must include a 'title' field");
  });

  it("should trim content after frontmatter", () => {
    const markdown = `---
title: Test
---


# Content with leading newlines`;

    const result = parseFrontmatter(markdown);

    expect(result.content).toBe("# Content with leading newlines");
    expect(result.content).not.toMatch(/^\n/);
  });
});

describe("markdown - rendering to HTML", () => {
  it("should render headings", async () => {
    const markdown = `# Heading 1
## Heading 2
### Heading 3`;

    const html = await renderToHtml(markdown);

    expect(html).toContain("<h1");
    expect(html).toContain("Heading 1");
    expect(html).toContain("<h2");
    expect(html).toContain("Heading 2");
    expect(html).toContain("<h3");
    expect(html).toContain("Heading 3");
  });

  it("should render lists", async () => {
    const markdown = `- Item 1
- Item 2
- Item 3`;

    const html = await renderToHtml(markdown);

    expect(html).toContain("<ul>");
    expect(html).toContain("<li>");
    expect(html).toContain("Item 1");
    expect(html).toContain("Item 2");
  });

  it("should render code blocks", async () => {
    const markdown = `\`\`\`typescript
const x = 1;
console.log(x);
\`\`\``;

    const html = await renderToHtml(markdown);

    expect(html).toContain("<pre");
    expect(html).toContain("<code");
    // Shiki syntax highlighting splits tokens into spans
    expect(html).toContain("const");
    expect(html).toContain("x");
    expect(html).toContain("1");
  });

  it("should render tables", async () => {
    const markdown = `| Col 1 | Col 2 |
|-------|-------|
| A     | B     |`;

    const html = await renderToHtml(markdown);

    expect(html).toContain("<table");
    expect(html).toContain("Col 1");
    expect(html).toContain("Col 2");
  });

  it("should render links", async () => {
    const markdown = `[Link text](https://example.com)`;

    const html = await renderToHtml(markdown);

    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain("Link text");
  });

  it("should render inline code", async () => {
    const markdown = `This is \`inline code\` in text.`;

    const html = await renderToHtml(markdown);

    expect(html).toContain("<code>");
    expect(html).toContain("inline code");
  });

  it("should render bold and italic", async () => {
    const markdown = `**bold** and *italic*`;

    const html = await renderToHtml(markdown);

    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("should render blockquotes", async () => {
    const markdown = `> This is a quote`;

    const html = await renderToHtml(markdown);

    expect(html).toContain("<blockquote");
    expect(html).toContain("This is a quote");
  });
});

describe("markdown - parseAndRender", () => {
  it("should parse frontmatter and render markdown in one step", async () => {
    const markdown = `---
title: Combined Test
description: Testing combined operation
---

# Content

This is **bold** text.`;

    const result = await parseAndRender(markdown);

    expect(result.frontmatter.title).toBe("Combined Test");
    expect(result.frontmatter.description).toBe("Testing combined operation");
    expect(result.html).toContain("<h1");
    expect(result.html).toContain("Content");
    expect(result.html).toContain("<strong>bold</strong>");
  });

  it("should handle markdown without frontmatter", async () => {
    const markdown = `# Simple Content

No frontmatter.`;

    const result = await parseAndRender(markdown);

    expect(result.frontmatter.title).toBe("");
    expect(result.html).toContain("<h1");
    expect(result.html).toContain("Simple Content");
  });

  it("should propagate frontmatter parsing errors", async () => {
    const markdown = `---
invalid yaml: [
---

Content`;

    try {
      await parseAndRender(markdown);
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Invalid frontmatter YAML");
    }
  });
});

describe("markdown - syntax highlighting with Shiki", () => {
  it("should highlight TypeScript code blocks with Shiki", async () => {
    const markdown = `\`\`\`typescript
const greeting: string = "Hello";
console.log(greeting);
\`\`\``;

    const html = await renderToHtml(markdown);

    // Check for Shiki's pre wrapper with github-dark theme
    expect(html).toContain('class="shiki github-dark"');
    expect(html).toContain("background-color:#24292e");

    // Check for inline color styles (Shiki's signature)
    expect(html).toContain("color:");
    expect(html).toContain("style=");

    // Verify code content is present
    expect(html).toContain("greeting");
    expect(html).toContain("Hello");

    // Verify Shiki's span structure for syntax tokens
    expect(html).toContain('<span class="line">');
    expect(html).toContain("<span style=");
  });

  it("should highlight JSON code blocks with Shiki", async () => {
    const markdown = `\`\`\`json
{
  "name": "test",
  "version": "1.0.0"
}
\`\`\``;

    const html = await renderToHtml(markdown);

    // Check for Shiki's pre wrapper with github-dark theme
    expect(html).toContain('class="shiki github-dark"');
    expect(html).toContain("background-color:#24292e");

    // Check for inline color styles
    expect(html).toContain("color:");
    expect(html).toContain("style=");

    // Verify JSON content is present
    expect(html).toContain("name");
    expect(html).toContain("test");
    expect(html).toContain("version");

    // Verify Shiki's span structure
    expect(html).toContain('<span class="line">');
  });

  it("should highlight JavaScript code blocks with Shiki", async () => {
    const markdown = `\`\`\`javascript
function add(a, b) {
  return a + b;
}
\`\`\``;

    const html = await renderToHtml(markdown);

    // Check for Shiki highlighting
    expect(html).toContain('class="shiki');
    expect(html).toContain("github-dark");
    expect(html).toContain("color:");

    // Verify code content
    expect(html).toContain("function");
    expect(html).toContain("add");
    expect(html).toContain("return");
  });

  it("should handle code blocks without language specification", async () => {
    const markdown = `\`\`\`
plain text code
\`\`\``;

    const html = await renderToHtml(markdown);

    // Should still use Shiki with 'text' as default
    expect(html).toContain('class="shiki');
    expect(html).toContain("plain text code");
  });

  it("should handle multiple code blocks in one document", async () => {
    const markdown = `# Example

\`\`\`typescript
const x: number = 42;
\`\`\`

Some text.

\`\`\`json
{"key": "value"}
\`\`\``;

    const html = await renderToHtml(markdown);

    // Should have two separate Shiki-highlighted code blocks
    const shikiMatches = html.match(/class="shiki/g);
    expect(shikiMatches?.length).toBe(2);

    // Both code snippets should be present (tokens may be separated by spans)
    expect(html).toContain("const");
    expect(html).toContain("42");
    expect(html).toContain("key");
    expect(html).toContain("value");
  });

  it("should preserve code indentation in highlighted blocks", async () => {
    const markdown = `\`\`\`typescript
if (true) {
  const nested = "indented";
  console.log(nested);
}
\`\`\``;

    const html = await renderToHtml(markdown);

    expect(html).toContain('class="shiki');
    expect(html).toContain("nested");
    expect(html).toContain("indented");
  });

  it("should handle special characters in code blocks", async () => {
    const markdown = `\`\`\`typescript
const html = "<div>Test</div>";
const obj = { key: "value" };
\`\`\``;

    const html = await renderToHtml(markdown);

    expect(html).toContain('class="shiki');
    // Shiki should handle special characters
    expect(html).toContain("div");
    expect(html).toContain("Test");
  });

  it("should use custom theme when specified in markdownOptions", async () => {
    const markdown = `\`\`\`typescript
const x = 42;
\`\`\``;

    const html = await renderToHtml(markdown, { shikiTheme: "github-light" });

    // Check for github-light theme
    expect(html).toContain('class="shiki github-light"');
    expect(html).toContain("background-color:#fff");

    // Should not contain github-dark theme
    expect(html).not.toContain("github-dark");
    expect(html).not.toContain("background-color:#24292e");
  });

  it("should default to github-dark theme when no options specified", async () => {
    const markdown = `\`\`\`typescript
const x = 42;
\`\`\``;

    const html = await renderToHtml(markdown);

    // Check for github-dark theme (default)
    expect(html).toContain('class="shiki github-dark"');
    expect(html).toContain("background-color:#24292e");
  });
});
