import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { parseMarkdown } from "../parser.ts";
import { markdownApp } from "../markdown-app.ts";
import { MageTestServer } from "../../test-utils/server.ts";
import { join } from "@std/path";
import { copy } from "@std/fs";

const fixturesDir = join(import.meta.dirname!, "fixtures");
const layoutFixture = join(fixturesDir, "layouts", "_layout-docs.tsx");

describe("security - slug validation prevents path traversal", () => {
  it("should reject slug with ../ path traversal", () => {
    const content = `---
title: Attack
slug: ../../../etc/passwd
layout: docs
---

Content`;

    expect(() => {
      parseMarkdown(content, "attack.md");
    }).toThrow("Invalid frontmatter");
  });

  it("should reject slug with encoded path traversal", () => {
    const content = `---
title: Attack
slug: ..%2F..%2Fetc%2Fpasswd
layout: docs
---

Content`;

    expect(() => {
      parseMarkdown(content, "attack.md");
    }).toThrow("Invalid frontmatter");
  });

  it("should reject slug starting with /", () => {
    const content = `---
title: Attack
slug: /etc/passwd
layout: docs
---

Content`;

    expect(() => {
      parseMarkdown(content, "attack.md");
    }).toThrow("Invalid frontmatter");
  });

  it("should allow valid nested slugs", () => {
    const content = `---
title: Valid
slug: api/v1/docs
layout: docs
---

Content`;

    expect(() => {
      parseMarkdown(content, "valid.md");
    }).not.toThrow();
  });
});

describe("security - HTTP path traversal prevention", () => {
  let server: MageTestServer;
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await Deno.makeTempDir({
      prefix: "markdown-app-security-http-",
    });
    const articlesDir = join(tempDir, "source");
    const outputDir = join(tempDir, "output");

    await Deno.mkdir(articlesDir, { recursive: true });
    await copy(layoutFixture, join(articlesDir, "_layout-docs.tsx"));

    await Deno.writeTextFile(
      join(articlesDir, "index.md"),
      `---
title: Home
slug: index
layout: docs
---

# Home`,
    );

    const mdApp = markdownApp({
      articlesDir,
      outputDir,
      layoutDir: articlesDir,
      basePath: "/docs",
      dev: false,
    });

    await mdApp.build();

    server = new MageTestServer();
    mdApp.register(server.app);
    server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it("should prevent path traversal via URL", async () => {
    const response = await fetch(server.url("/docs/../../deno.json"));

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not Found");
  });

  it("should prevent accessing files outside basePath", async () => {
    const response = await fetch(server.url("/docs/../index.html"));

    expect(response.status).toBe(404);
    await response.text(); // Consume body
  });

  it("should prevent URL encoded path traversal", async () => {
    const response = await fetch(server.url("/docs/..%2F..%2Fdeno.json"));

    expect(response.status).toBe(404);
    await response.text(); // Consume body
  });

  it("should prevent double-encoded path traversal", async () => {
    const response = await fetch(
      server.url("/docs/%252e%252e%252f%252e%252e%252fdeno.json"),
    );

    expect(response.status).toBe(404);
    await response.text(); // Consume body
  });
});

describe("security - XSS prevention in markdown", () => {
  it("should escape HTML in markdown by default", () => {
    const content = `---
title: Test
slug: test
layout: docs
---

<script>alert('XSS')</script>

Normal content here.`;

    const result = parseMarkdown(content, "test.md");

    // GFM should sanitize/remove the script tag
    expect(result.content).not.toContain("<script>alert('XSS')</script>");
    expect(result.content).not.toContain("alert('XSS')");
    // Should only contain the normal content
    expect(result.content).toContain("Normal content here");
  });

  it("should handle malicious link href", () => {
    const content = `---
title: Test
slug: test
layout: docs
---

[Click me](javascript:alert('XSS'))`;

    const result = parseMarkdown(content, "test.md");

    // The link should be sanitized or removed
    expect(result.content).not.toContain("javascript:alert");
  });

  it("should handle img src XSS attempts", () => {
    const content = `---
title: Test
slug: test
layout: docs
---

![Image](javascript:alert('XSS'))`;

    const result = parseMarkdown(content, "test.md");

    // The javascript: protocol should be sanitized
    expect(result.content).not.toContain("javascript:alert");
  });
});

describe("security - frontmatter injection", () => {
  it("should handle malicious YAML in frontmatter", () => {
    const content = `---
title: "Test \${malicious}"
slug: test
layout: docs
description: "'; DROP TABLE users; --"
---

Content`;

    const result = parseMarkdown(content, "test.md");

    // Should parse without executing anything
    expect(result.frontmatter.title).toBe("Test ${malicious}");
    expect(result.frontmatter.description).toBe("'; DROP TABLE users; --");
  });
});
