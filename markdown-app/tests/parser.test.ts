import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { parseMarkdown } from "../parser.ts";

describe("markdown-app - parser", () => {
  describe("parseMarkdown", () => {
    it("should parse valid frontmatter and markdown", () => {
      const content = `---
title: Test Page
slug: test
layout: docs
---

# Hello World

This is a test.`;

      const result = parseMarkdown(content, "test.md");

      expect(result.frontmatter.title).toBe("Test Page");
      expect(result.frontmatter.slug).toBe("test");
      expect(result.frontmatter.layout).toBe("docs");
      expect(result.content).toContain("<h1");
      expect(result.content).toContain("Hello World");
      expect(result.content).toContain("This is a test.");
    });

    it("should parse optional frontmatter fields", () => {
      const content = `---
title: Test Page
slug: test
layout: docs
nav: Guide/Getting Started
nav-order: 1
---

Content here.`;

      const result = parseMarkdown(content, "test.md");

      expect(result.frontmatter.nav).toBe("Guide/Getting Started");
      expect(result.frontmatter["nav-order"]).toBe(1);
    });

    it("should render markdown to HTML with GFM", () => {
      const content = `---
title: Test
slug: test
layout: docs
---

# Heading 1
## Heading 2

- List item 1
- List item 2

\`\`\`typescript
const x = 1;
\`\`\`
`;

      const result = parseMarkdown(content, "test.md");

      expect(result.content).toContain("<h1");
      expect(result.content).toContain("<h2");
      expect(result.content).toContain("<ul>");
      expect(result.content).toContain("<li>");
      expect(result.content).toContain("<code");
    });

    it("should throw error for missing frontmatter", () => {
      const content = `# Just markdown

No frontmatter here.`;

      expect(() => {
        parseMarkdown(content, "test.md");
      }).toThrow("Missing frontmatter");
    });

    it("should throw error for invalid YAML in frontmatter", () => {
      const content = `---
title: Test
invalid yaml: [unclosed
---

Content`;

      expect(() => {
        parseMarkdown(content, "test.md");
      }).toThrow("Invalid YAML frontmatter");
    });

    it("should throw error for missing required field: title", () => {
      const content = `---
slug: test
layout: docs
---

Content`;

      expect(() => {
        parseMarkdown(content, "test.md");
      }).toThrow("Missing required frontmatter fields");
      expect(() => {
        parseMarkdown(content, "test.md");
      }).toThrow("title");
    });

    it("should throw error for missing required field: slug", () => {
      const content = `---
title: Test
layout: docs
---

Content`;

      expect(() => {
        parseMarkdown(content, "test.md");
      }).toThrow("Missing required frontmatter fields");
      expect(() => {
        parseMarkdown(content, "test.md");
      }).toThrow("slug");
    });

    it("should throw error for missing required field: layout", () => {
      const content = `---
title: Test
slug: test
---

Content`;

      expect(() => {
        parseMarkdown(content, "test.md");
      }).toThrow("Missing required frontmatter fields");
      expect(() => {
        parseMarkdown(content, "test.md");
      }).toThrow("layout");
    });

    it("should throw error for invalid slug with path traversal", () => {
      const content = `---
title: Test
slug: ../etc/passwd
layout: docs
---

Content`;

      expect(() => {
        parseMarkdown(content, "test.md");
      }).toThrow("Invalid slug");
      expect(() => {
        parseMarkdown(content, "test.md");
      }).toThrow("..");
    });

    it("should throw error for slug starting with /", () => {
      const content = `---
title: Test
slug: /absolute/path
layout: docs
---

Content`;

      expect(() => {
        parseMarkdown(content, "test.md");
      }).toThrow("Invalid slug");
      expect(() => {
        parseMarkdown(content, "test.md");
      }).toThrow("cannot");
    });

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

    it("should preserve rawMarkdown", () => {
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

    it("should handle markdown with code blocks", () => {
      const content = `---
title: Test
slug: test
layout: docs
---

Example:

\`\`\`javascript
function hello() {
  console.log("world");
}
\`\`\`
`;

      const result = parseMarkdown(content, "test.md");

      expect(result.content).toContain("hello");
      expect(result.content).toContain("console");
    });

    it("should handle markdown with tables", () => {
      const content = `---
title: Test
slug: test
layout: docs
---

| Column 1 | Column 2 |
|----------|----------|
| Value 1  | Value 2  |
`;

      const result = parseMarkdown(content, "test.md");

      expect(result.content).toContain("<table");
      expect(result.content).toContain("Column 1");
      expect(result.content).toContain("Value 1");
    });

    it("should handle markdown with links", () => {
      const content = `---
title: Test
slug: test
layout: docs
---

[Link text](https://example.com)
`;

      const result = parseMarkdown(content, "test.md");

      expect(result.content).toContain('<a href="https://example.com"');
      expect(result.content).toContain("Link text");
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
});
