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
    const result = await renderPage(markdown, FIXTURES_DIR, {
      assetMap,
      bundleUrl: "/__bundles/test.js",
    });

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
    const result = await renderPage(markdown, FIXTURES_DIR, {
      assetMap,
      bundleUrl: "/__bundles/test.js",
    });

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
    const result = await renderPage(markdown, FIXTURES_DIR, {
      assetMap,
      bundleUrl: "/__bundles/test.js",
    });

    expect(result.frontmatter.author).toBe("John Doe");
  });

  it("should render complete HTML document", async () => {
    const markdown = `---
title: Complete Page
---

# Test`;

    const assetMap = new Map();
    const result = await renderPage(markdown, FIXTURES_DIR, {
      assetMap,
      bundleUrl: "/__bundles/test.js",
    });

    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("<html");
    expect(result.html).toContain("<head");
    expect(result.html).toContain("<body");
  });

  it("should replace asset URLs with hashed versions", async () => {
    const markdown = `---
title: Asset Test
---

# Test`;

    const assetMap = new Map([
      ["/public/styles.css", "/__public/styles-abc123.css"],
    ]);
    const result = await renderPage(markdown, FIXTURES_DIR, {
      assetMap,
      bundleUrl: "/__bundles/test.js",
    });

    // Should NOT contain clean URLs
    expect(result.html).not.toContain("/public/styles.css");

    // Should contain hashed URLs
    expect(result.html).toContain("/__public/styles-abc123.css");
  });

  it("should include description meta tag when description is present", async () => {
    const markdown = `---
title: Test Page
description: This is a test description
---

# Content`;

    const assetMap = new Map();
    const result = await renderPage(markdown, FIXTURES_DIR, {
      assetMap,
      bundleUrl: "/__bundles/test.js",
    });

    expect(result.html).toContain('<meta name="description"');
    expect(result.html).toContain("This is a test description");
  });

  it("should not include description meta tag when description is absent", async () => {
    const markdown = `---
title: Test Page
---

# Content`;

    const assetMap = new Map();
    const result = await renderPage(markdown, FIXTURES_DIR, {
      assetMap,
      bundleUrl: "/__bundles/test.js",
    });

    expect(result.html).not.toContain('<meta name="description"');
  });
});

describe("renderer - error handling", () => {
  it("should throw error when layout file does not exist", async () => {
    const markdown = `---
title: Test
layout: nonexistent
---

# Content`;

    const assetMap = new Map();

    try {
      await renderPage(markdown, FIXTURES_DIR, {
        assetMap,
        bundleUrl: "/__bundles/test.js",
      });
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Layout file not found");
    }
  });

  it("should throw error when frontmatter is invalid", async () => {
    const markdown = `---
title: Test
invalid: [unclosed
---

# Content`;

    const assetMap = new Map();

    try {
      await renderPage(markdown, FIXTURES_DIR, {
        assetMap,
        bundleUrl: "/__bundles/test.js",
      });
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Invalid frontmatter YAML");
    }
  });

  it("should throw error when title is missing in frontmatter", async () => {
    const markdown = `---
description: No title
---

# Content`;

    const assetMap = new Map();

    try {
      await renderPage(markdown, FIXTURES_DIR, {
        assetMap,
        bundleUrl: "/__bundles/test.js",
      });
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain(
        "Frontmatter must include a 'title' field",
      );
    }
  });
});

describe("renderer - file rendering", () => {
  it("should render page from file", async () => {
    const filePath = join(FIXTURES_DIR, "pages", "index.md");
    const assetMap = new Map();

    const result = await renderPageFromFile(filePath, FIXTURES_DIR, {
      assetMap,
      bundleUrl: "/__bundles/test.js",
    });

    expect(result.frontmatter.title).toBe("Home");
    expect(result.frontmatter.description).toBe("Welcome to the site");
    expect(result.html).toContain("Welcome");
  });

  it("should render nested page from file", async () => {
    const filePath = join(FIXTURES_DIR, "pages", "docs", "intro.md");
    const assetMap = new Map();

    const result = await renderPageFromFile(filePath, FIXTURES_DIR, {
      assetMap,
      bundleUrl: "/__bundles/test.js",
    });

    expect(result.frontmatter.title).toBe("Introduction");
    expect(result.html).toContain("Getting started");
  });
});

describe("renderer - SSR bundle rendering", () => {
  it("should render page with SSR bundle instead of loading layout from file", async () => {
    const markdown = `---
title: SSR Test
---

# Hello from SSR`;

    const assetMap = new Map();

    // Create a bundled layout component using actual Preact h function
    const ssrBundle = `
      import { h } from "preact";

      export default function Layout(props) {
        return h('html', { lang: 'en' }, [
          h('head', null, [
            h('title', null, props.title)
          ]),
          h('body', null, [
            h('div', { dangerouslySetInnerHTML: { __html: props.html } })
          ])
        ]);
      }
    `;

    const result = await renderPage(markdown, FIXTURES_DIR, {
      assetMap,
      bundleUrl: "/__bundles/test.js",
      ssrBundle,
    });

    expect(result.html).toContain("SSR Test");
    expect(result.html).toContain("Hello from SSR");
    expect(result.frontmatter.title).toBe("SSR Test");
  });

  it("should use regular layout loading when ssrBundle is not provided", async () => {
    const markdown = `---
title: Regular Test
---

# Regular content`;

    const assetMap = new Map();

    const result = await renderPage(markdown, FIXTURES_DIR, {
      assetMap,
      bundleUrl: "/__bundles/test.js",
      // No ssrBundle provided
    });

    expect(result.html).toContain("Regular Test");
    expect(result.html).toContain("Regular content");
  });

  it("should pass all props to bundled layout", async () => {
    const markdown = `---
title: Props Test
description: Testing props
author: Jane Doe
---

# Content`;

    const assetMap = new Map();

    const ssrBundle = `
      import { h } from "preact";

      export default function Layout(props) {
        const hasAuthor = props.additionalFrontmatter?.author ? 'has-author' : 'no-author';
        return h('html', { lang: 'en' }, [
          h('head', null, [
            h('title', null, props.title)
          ]),
          h('body', { className: hasAuthor }, [
            h('div', { dangerouslySetInnerHTML: { __html: props.html } })
          ])
        ]);
      }
    `;

    const result = await renderPage(markdown, FIXTURES_DIR, {
      assetMap,
      bundleUrl: "/__bundles/test.js",
      ssrBundle,
    });

    expect(result.frontmatter.author).toBe("Jane Doe");
    expect(result.html).toContain("has-author");
  });
});
