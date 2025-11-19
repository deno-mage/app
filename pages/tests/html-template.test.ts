import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import { loadHtmlTemplate, renderWithTemplate } from "../html-template.ts";
import type { HtmlTemplateProps } from "../types.ts";

const FIXTURES_DIR = join(
  new URL(".", import.meta.url).pathname,
  "fixtures",
);

describe("html-template - loading", () => {
  it("should load custom _html.tsx template when it exists", async () => {
    const template = await loadHtmlTemplate(FIXTURES_DIR);

    const props: HtmlTemplateProps = {
      head: "<title>Test</title>",
      body: "<div>Content</div>",
      props: { html: "", title: "Test" },
    };

    const html = renderWithTemplate(template, props);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Test</title>");
    expect(html).toContain("<div>Content</div>");
  });

  it("should use default template when _html.tsx does not exist", async () => {
    const template = await loadHtmlTemplate("/nonexistent");

    const props: HtmlTemplateProps = {
      head: "<title>Default</title>",
      body: "<p>Body content</p>",
      props: { html: "", title: "Default" },
    };

    const html = renderWithTemplate(template, props);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Default</title>");
    expect(html).toContain("<p>Body content</p>");
    expect(html).toContain('<div id="app" data-layout="true">');
  });

  it("should throw error when _html.tsx exists but has no default export", async () => {
    const badTemplateDir = join(FIXTURES_DIR, "bad-template");

    try {
      await loadHtmlTemplate(badTemplateDir);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain(
        "must export a default function",
      );
    }
  });
});

describe("html-template - rendering", () => {
  it("should render head content", async () => {
    const template = await loadHtmlTemplate("/nonexistent");

    const props: HtmlTemplateProps = {
      head: "<title>My Title</title>\n<meta name='description' content='Test'>",
      body: "<div>Content</div>",
      props: { html: "", title: "My Title" },
    };

    const html = renderWithTemplate(template, props);

    expect(html).toContain("<title>My Title</title>");
    expect(html).toContain("<meta name='description' content='Test'>");
  });

  it("should render body content", async () => {
    const template = await loadHtmlTemplate("/nonexistent");

    const props: HtmlTemplateProps = {
      head: "",
      body: "<main><h1>Hello</h1><p>World</p></main>",
      props: { html: "", title: "Test" },
    };

    const html = renderWithTemplate(template, props);

    expect(html).toContain("<main><h1>Hello</h1><p>World</p></main>");
  });

  it("should include bundle script when bundleUrl is provided", async () => {
    const template = await loadHtmlTemplate("/nonexistent");

    const props: HtmlTemplateProps = {
      head: "<title>Test</title>",
      body: "<div>Content</div>",
      bundleUrl: "/__bundles/test-abc123.js",
      props: { html: "", title: "Test", description: "Test page" },
    };

    const html = renderWithTemplate(template, props);

    expect(html).toContain("window.__PAGE_PROPS__");
    expect(html).toContain('"title":"Test"');
    expect(html).toContain('"description":"Test page"');
    expect(html).toContain(
      '<script type="module" src="/__bundles/test-abc123.js">',
    );
  });

  it("should not include bundle script when bundleUrl is not provided", async () => {
    const template = await loadHtmlTemplate("/nonexistent");

    const props: HtmlTemplateProps = {
      head: "<title>Test</title>",
      body: "<div>Content</div>",
      props: { html: "", title: "Test" },
    };

    const html = renderWithTemplate(template, props);

    expect(html).not.toContain("window.__PAGE_PROPS__");
    expect(html).not.toContain('<script type="module"');
  });

  it("should serialize props correctly", async () => {
    const template = await loadHtmlTemplate("/nonexistent");

    const props: HtmlTemplateProps = {
      head: "",
      body: "<div>Content</div>",
      bundleUrl: "/__bundles/test.js",
      props: {
        html: "<p>Should not be in serialized props</p>",
        title: "Test Page",
        description: "Test description",
        customField: "custom value",
      },
    };

    const html = renderWithTemplate(template, props);

    // Props should be serialized
    expect(html).toContain('"title":"Test Page"');
    expect(html).toContain('"description":"Test description"');
    expect(html).toContain('"customField":"custom value"');

    // html field should be included (extraction happens client-side)
    expect(html).toContain('"html":"<p>Should not be in serialized props</p>"');
  });
});

describe("html-template - custom template", () => {
  it("should use custom template structure when provided", async () => {
    const template = await loadHtmlTemplate(FIXTURES_DIR);

    const props: HtmlTemplateProps = {
      head: "<title>Custom</title>",
      body: "<div>Custom body</div>",
      props: { html: "", title: "Custom" },
    };

    const html = renderWithTemplate(template, props);

    // Custom template should have its own structure
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Custom</title>");
    expect(html).toContain("<div>Custom body</div>");
  });
});
