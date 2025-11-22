import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import type { VNode } from "preact";
import {
  buildLayoutProps,
  loadLayout,
  loadLayoutFromBundle,
  resolveLayout,
  resolveLayoutPath,
} from "../layout.ts";
import type { Frontmatter } from "../types.ts";

const FIXTURES_DIR = join(
  new URL(".", import.meta.url).pathname,
  "fixtures",
);

describe("layout - path resolution", () => {
  it("should resolve default layout when no layout specified", () => {
    const path = resolveLayoutPath(undefined, FIXTURES_DIR);

    expect(path).toBe(join(FIXTURES_DIR, "layouts", "default.tsx"));
  });

  it("should resolve named layout", () => {
    const path = resolveLayoutPath("article", FIXTURES_DIR);

    expect(path).toBe(join(FIXTURES_DIR, "layouts", "article.tsx"));
  });

  it("should always use .tsx extension", () => {
    const path = resolveLayoutPath("custom", FIXTURES_DIR);

    expect(path).toContain(".tsx");
    expect(path.endsWith(".tsx")).toBe(true);
  });
});

describe("layout - loading", () => {
  it("should load default layout", async () => {
    const layoutPath = join(FIXTURES_DIR, "layouts", "default.tsx");
    const layout = await loadLayout(layoutPath);

    expect(typeof layout).toBe("function");
  });

  it("should load named layout", async () => {
    const layoutPath = join(FIXTURES_DIR, "layouts", "article.tsx");
    const layout = await loadLayout(layoutPath);

    expect(typeof layout).toBe("function");
  });

  it("should fail when layout file not found", async () => {
    const layoutPath = join(FIXTURES_DIR, "layouts", "nonexistent.tsx");

    try {
      await loadLayout(layoutPath);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Layout file not found");
    }
  });

  it("should fail when layout has no default export", async () => {
    const layoutPath = join(FIXTURES_DIR, "layouts", "no-default-export.tsx");

    try {
      await loadLayout(layoutPath);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain(
        "Layout file must have a default export",
      );
    }
  });

  it("should include file path in error message", async () => {
    const layoutPath = join(FIXTURES_DIR, "layouts", "missing.tsx");

    try {
      await loadLayout(layoutPath);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain(layoutPath);
    }
  });
});

describe("layout - resolve from frontmatter", () => {
  it("should resolve default layout when layout field is undefined", async () => {
    const frontmatter: Frontmatter = {
      title: "Test",
    };

    const layout = await resolveLayout(frontmatter, FIXTURES_DIR);

    expect(typeof layout).toBe("function");
  });

  it("should resolve named layout from frontmatter", async () => {
    const frontmatter: Frontmatter = {
      title: "Test",
      layout: "article",
    };

    const layout = await resolveLayout(frontmatter, FIXTURES_DIR);

    expect(typeof layout).toBe("function");
  });

  it("should fail when specified layout does not exist", async () => {
    const frontmatter: Frontmatter = {
      title: "Test",
      layout: "nonexistent",
    };

    try {
      await resolveLayout(frontmatter, FIXTURES_DIR);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Layout file not found");
    }
  });
});

describe("layout - build props", () => {
  it("should build basic layout props", () => {
    const html = "<h1>Hello</h1>";
    const frontmatter: Frontmatter = {
      title: "Test Page",
    };

    const props = buildLayoutProps(html, frontmatter);

    expect(props.html).toBe(html);
    expect(props.title).toBe("Test Page");
    expect(props.description).toBeUndefined();
  });

  it("should include description when present", () => {
    const html = "<p>Content</p>";
    const frontmatter: Frontmatter = {
      title: "Test",
      description: "A test page",
    };

    const props = buildLayoutProps(html, frontmatter);

    expect(props.description).toBe("A test page");
  });

  it("should exclude layout field from props", () => {
    const html = "<p>Content</p>";
    const frontmatter: Frontmatter = {
      title: "Test",
      layout: "article",
    };

    const props = buildLayoutProps(html, frontmatter);

    expect(props.additionalFrontmatter?.layout).toBeUndefined();
  });

  it("should nest custom frontmatter fields in additionalFrontmatter", () => {
    const html = "<p>Content</p>";
    const frontmatter: Frontmatter = {
      title: "Test",
      author: "John Doe",
      tags: ["javascript", "testing"],
      draft: true,
    };

    const props = buildLayoutProps(html, frontmatter);

    expect(props.additionalFrontmatter?.author).toBe("John Doe");
    expect(props.additionalFrontmatter?.tags).toEqual([
      "javascript",
      "testing",
    ]);
    expect(props.additionalFrontmatter?.draft).toBe(true);
  });

  it("should handle frontmatter with only required fields", () => {
    const html = "<p>Content</p>";
    const frontmatter: Frontmatter = {
      title: "Minimal",
    };

    const props = buildLayoutProps(html, frontmatter);

    expect(props.html).toBe(html);
    expect(props.title).toBe("Minimal");
    // Has html, title, and description (undefined)
    expect(Object.keys(props).length).toBe(3);
  });
});

describe("layout - loading from bundle", () => {
  it("should load layout from bundled code", async () => {
    // Simple layout component as ESM module
    const bundledCode = `
      export default function Layout(props) {
        return { type: 'div', props: { children: props.html } };
      }
    `;

    const layout = await loadLayoutFromBundle(bundledCode);

    expect(typeof layout).toBe("function");
  });

  it("should execute bundled layout component", async () => {
    const bundledCode = `
      export default function Layout(props) {
        return { type: 'div', props: { children: props.html } };
      }
    `;

    const layout = await loadLayoutFromBundle(bundledCode);
    const result = layout({ html: "<p>Test</p>", title: "Test" }) as VNode;

    expect(result).toBeTruthy();
    expect(result.type).toBe("div");
    expect(result.props.children).toBe("<p>Test</p>");
  });

  it("should fail when bundle has no default export", async () => {
    const bundledCode = `
      export function notDefault() {
        return {};
      }
    `;

    try {
      await loadLayoutFromBundle(bundledCode);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain(
        "Bundled layout must have a default export",
      );
    }
  });

  it("should handle complex bundled code with dependencies", async () => {
    // Simulate bundled code with Preact
    const bundledCode = `
      const h = (type, props, ...children) => ({ type, props: { ...props, children } });
      const Component = (props) => h('span', null, props.text);
      export default function Layout(props) {
        return h('div', null, Component({ text: props.title }));
      }
    `;

    const layout = await loadLayoutFromBundle(bundledCode);
    const result = layout({ html: "", title: "Hello" }) as VNode;

    expect(result).toBeTruthy();
    expect(result.type).toBe("div");
  });
});
