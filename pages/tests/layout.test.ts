import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import {
  buildLayoutProps,
  loadLayout,
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

    expect(props.layout).toBeUndefined();
  });

  it("should spread custom frontmatter fields", () => {
    const html = "<p>Content</p>";
    const frontmatter: Frontmatter = {
      title: "Test",
      author: "John Doe",
      tags: ["javascript", "testing"],
      draft: true,
    };

    const props = buildLayoutProps(html, frontmatter);

    expect(props.author).toBe("John Doe");
    expect(props.tags).toEqual(["javascript", "testing"]);
    expect(props.draft).toBe(true);
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
