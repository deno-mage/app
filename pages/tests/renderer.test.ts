import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import { renderPage, renderPageFromFile } from "../renderer.ts";

const FIXTURES_DIR = join(
  new URL(".", import.meta.url).pathname,
  "fixtures",
);

describe("renderer - page rendering", () => {
  it("should render markdown with layout", async () => {
    const markdown = `---
title: Test Page
description: A test
---

# Hello World

This is a test.`;

    const assetMap = new Map();
    const result = await renderPage(markdown, FIXTURES_DIR, assetMap);

    expect(result.html).toContain("<html");
    expect(result.html).toContain("<title>Test Page</title>");
    expect(result.html).toContain("Hello World");
    expect(result.frontmatter.title).toBe("Test Page");
  });

  it("should use article layout when specified", async () => {
    const markdown = `---
title: Article Page
layout: article
---

# Article Content`;

    const assetMap = new Map();
    const result = await renderPage(markdown, FIXTURES_DIR, assetMap);

    expect(result.html).toContain("<article");
    expect(result.html).toContain("Article Page");
  });

  it("should pass custom frontmatter to layout", async () => {
    const markdown = `---
title: Custom Page
author: John Doe
---

# Content`;

    const assetMap = new Map();
    const result = await renderPage(markdown, FIXTURES_DIR, assetMap);

    expect(result.frontmatter.author).toBe("John Doe");
  });

  it("should render complete HTML document", async () => {
    const markdown = `---
title: Complete Page
---

# Test`;

    const assetMap = new Map();
    const result = await renderPage(markdown, FIXTURES_DIR, assetMap);

    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("<html");
    expect(result.html).toContain("<head");
    expect(result.html).toContain("<body");
  });
});

describe("renderer - file rendering", () => {
  it("should render page from file", async () => {
    const filePath = join(FIXTURES_DIR, "pages", "index.md");
    const assetMap = new Map();

    const result = await renderPageFromFile(filePath, FIXTURES_DIR, assetMap);

    expect(result.frontmatter.title).toBe("Home");
    expect(result.frontmatter.description).toBe("Welcome to the site");
    expect(result.html).toContain("Welcome");
  });

  it("should render nested page from file", async () => {
    const filePath = join(FIXTURES_DIR, "pages", "docs", "intro.md");
    const assetMap = new Map();

    const result = await renderPageFromFile(filePath, FIXTURES_DIR, assetMap);

    expect(result.frontmatter.title).toBe("Introduction");
    expect(result.html).toContain("Getting started");
  });
});
