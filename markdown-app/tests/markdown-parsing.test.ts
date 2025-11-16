import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { parseMarkdown } from "../parser.ts";

describe("markdown-parsing - frontmatter", () => {
  it("should parse valid frontmatter", () => {
    const content = `---
title: Test Page
slug: test
layout: docs
---

# Hello World`;

    const result = parseMarkdown(content, "test.md");

    expect(result.frontmatter.title).toBe("Test Page");
    expect(result.frontmatter.slug).toBe("test");
    expect(result.frontmatter.layout).toBe("docs");
  });

  it("should parse optional frontmatter fields", () => {
    const content = `---
title: Test
slug: test
layout: docs
nav-item: Guide/Getting Started
nav-group: aside
nav-order: 1
description: A test page
---

Content`;

    const result = parseMarkdown(content, "test.md");

    expect(result.frontmatter["nav-item"]).toBe("Guide/Getting Started");
    expect(result.frontmatter["nav-group"]).toBe("aside");
    expect(result.frontmatter["nav-order"]).toBe(1);
    expect(result.frontmatter.description).toBe("A test page");
  });

  it("should fail when frontmatter is missing", () => {
    const content = `# Just markdown

No frontmatter here.`;

    expect(() => {
      parseMarkdown(content, "test.md");
    }).toThrow("Missing frontmatter");
  });

  it("should fail when frontmatter YAML is invalid", () => {
    const content = `---
title: Test
invalid yaml: [unclosed
---

Content`;

    expect(() => {
      parseMarkdown(content, "test.md");
    }).toThrow("Invalid YAML");
  });

  it("should fail when required field 'title' is missing", () => {
    const content = `---
slug: test
layout: docs
---

Content`;

    expect(() => {
      parseMarkdown(content, "test.md");
    }).toThrow("Invalid frontmatter");
  });

  it("should fail when required field 'slug' is missing", () => {
    const content = `---
title: Test
layout: docs
---

Content`;

    expect(() => {
      parseMarkdown(content, "test.md");
    }).toThrow("Invalid frontmatter");
  });

  it("should fail when required field 'layout' is missing", () => {
    const content = `---
title: Test
slug: test
---

Content`;

    expect(() => {
      parseMarkdown(content, "test.md");
    }).toThrow("Invalid frontmatter");
  });

  it("should include filepath in error messages", () => {
    const content = `---
title: Test
---

Missing slug`;

    expect(() => {
      parseMarkdown(content, "path/to/file.md");
    }).toThrow("path/to/file.md");
  });
});

describe("markdown-parsing - GitHub Flavored Markdown", () => {
  it("should render headings", () => {
    const content = `---
title: Test
slug: test
layout: docs
---

# Heading 1
## Heading 2
### Heading 3`;

    const result = parseMarkdown(content, "test.md");

    expect(result.content).toContain("<h1");
    expect(result.content).toContain("Heading 1");
    expect(result.content).toContain("<h2");
    expect(result.content).toContain("Heading 2");
    expect(result.content).toContain("<h3");
    expect(result.content).toContain("Heading 3");
  });

  it("should render lists", () => {
    const content = `---
title: Test
slug: test
layout: docs
---

- List item 1
- List item 2
- List item 3`;

    const result = parseMarkdown(content, "test.md");

    expect(result.content).toContain("<ul>");
    expect(result.content).toContain("<li>");
    expect(result.content).toContain("List item 1");
  });

  it("should render code blocks with language", () => {
    const content = `---
title: Test
slug: test
layout: docs
---

\`\`\`typescript
const x = 1;
console.log(x);
\`\`\``;

    const result = parseMarkdown(content, "test.md");

    expect(result.content).toContain("<pre>");
    expect(result.content).toContain("<code>");
    expect(result.content).toContain("const x = 1");
    expect(result.content).toContain("console.log(x)");
  });

  it("should render tables", () => {
    const content = `---
title: Test
slug: test
layout: docs
---

| Column 1 | Column 2 |
|----------|----------|
| Value 1  | Value 2  |`;

    const result = parseMarkdown(content, "test.md");

    expect(result.content).toContain("<table");
    expect(result.content).toContain("Column 1");
    expect(result.content).toContain("Value 1");
  });

  it("should render links", () => {
    const content = `---
title: Test
slug: test
layout: docs
---

[Link text](https://example.com)`;

    const result = parseMarkdown(content, "test.md");

    expect(result.content).toContain('<a href="https://example.com"');
    expect(result.content).toContain("Link text");
  });

  it("should render inline code", () => {
    const content = `---
title: Test
slug: test
layout: docs
---

This is \`inline code\` in a sentence.`;

    const result = parseMarkdown(content, "test.md");

    expect(result.content).toContain("<code>");
    expect(result.content).toContain("inline code");
  });

  it("should render bold and italic text", () => {
    const content = `---
title: Test
slug: test
layout: docs
---

This is **bold** and this is *italic*.`;

    const result = parseMarkdown(content, "test.md");

    expect(result.content).toContain("<strong>bold</strong>");
    expect(result.content).toContain("<em>italic</em>");
  });
});

describe("markdown-parsing - slug validation", () => {
  it("should allow valid nested slugs", () => {
    const content = `---
title: Test
slug: api/router
layout: docs
---

Content`;

    const result = parseMarkdown(content, "test.md");

    expect(result.frontmatter.slug).toBe("api/router");
  });

  it("should fail for slug with path traversal", () => {
    const content = `---
title: Test
slug: ../etc/passwd
layout: docs
---

Content`;

    expect(() => {
      parseMarkdown(content, "test.md");
    }).toThrow("Invalid frontmatter");
  });

  it("should fail for slug starting with /", () => {
    const content = `---
title: Test
slug: /absolute/path
layout: docs
---

Content`;

    expect(() => {
      parseMarkdown(content, "test.md");
    }).toThrow("Invalid frontmatter");
  });
});

describe("markdown-parsing - raw markdown preservation", () => {
  it("should preserve raw markdown without frontmatter", () => {
    const content = `---
title: Test
slug: test
layout: docs
---

# Hello

This is **bold**.`;

    const result = parseMarkdown(content, "test.md");

    expect(result.rawMarkdown).toContain("# Hello");
    expect(result.rawMarkdown).toContain("This is **bold**.");
    expect(result.rawMarkdown).not.toContain("---");
    expect(result.rawMarkdown).not.toContain("title:");
  });
});
