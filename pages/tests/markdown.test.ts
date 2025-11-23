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
  it("should render headings", () => {
    const markdown = `# Heading 1
## Heading 2
### Heading 3`;

    const html = renderToHtml(markdown);

    expect(html).toContain("<h1");
    expect(html).toContain("Heading 1");
    expect(html).toContain("<h2");
    expect(html).toContain("Heading 2");
    expect(html).toContain("<h3");
    expect(html).toContain("Heading 3");
  });

  it("should render lists", () => {
    const markdown = `- Item 1
- Item 2
- Item 3`;

    const html = renderToHtml(markdown);

    expect(html).toContain("<ul>");
    expect(html).toContain("<li>");
    expect(html).toContain("Item 1");
    expect(html).toContain("Item 2");
  });

  it("should render code blocks", () => {
    const markdown = `\`\`\`typescript
const x = 1;
console.log(x);
\`\`\``;

    const html = renderToHtml(markdown);

    expect(html).toContain("<pre");
    expect(html).toContain("<code");
    expect(html).toContain("const x = 1");
  });

  it("should render tables", () => {
    const markdown = `| Col 1 | Col 2 |
|-------|-------|
| A     | B     |`;

    const html = renderToHtml(markdown);

    expect(html).toContain("<table");
    expect(html).toContain("Col 1");
    expect(html).toContain("Col 2");
  });

  it("should render links", () => {
    const markdown = `[Link text](https://example.com)`;

    const html = renderToHtml(markdown);

    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain("Link text");
  });

  it("should render inline code", () => {
    const markdown = `This is \`inline code\` in text.`;

    const html = renderToHtml(markdown);

    expect(html).toContain("<code>");
    expect(html).toContain("inline code");
  });

  it("should render bold and italic", () => {
    const markdown = `**bold** and *italic*`;

    const html = renderToHtml(markdown);

    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("should render blockquotes", () => {
    const markdown = `> This is a quote`;

    const html = renderToHtml(markdown);

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

  it("should propagate frontmatter parsing errors", () => {
    const markdown = `---
invalid yaml: [
---

Content`;

    expect(() => {
      parseAndRender(markdown);
    }).toThrow("Invalid frontmatter YAML");
  });
});
