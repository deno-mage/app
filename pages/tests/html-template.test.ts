import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import { loadHtmlTemplate, renderWithTemplate } from "../html-template.tsx";

const FIXTURES_DIR = join(
  new URL(".", import.meta.url).pathname,
  "fixtures",
);

describe("html-template - loading", () => {
  it("should load custom _html.tsx template when it exists", async () => {
    const template = await loadHtmlTemplate(FIXTURES_DIR);

    const html = renderWithTemplate(
      template,
      { layoutProps: { html: "", title: "Test" } },
      "<title>Test</title>",
      "<div>Content</div>",
      "/__bundles/test.js",
    );

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Test</title>");
    expect(html).toContain("<div>Content</div>");
  });

  it("should use default template when _html.tsx does not exist", async () => {
    const template = await loadHtmlTemplate("/nonexistent");

    const html = renderWithTemplate(
      template,
      { layoutProps: { html: "", title: "Default" } },
      "<title>Default</title>",
      "<p>Body content</p>",
      "/__bundles/default.js",
    );

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Default</title>");
    expect(html).toContain("<p>Body content</p>");
    expect(html).toContain('<div id="app" data-mage-content="true">');
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

describe("html-template - injection", () => {
  it("should inject head content before </head>", async () => {
    const template = await loadHtmlTemplate("/nonexistent");

    const html = renderWithTemplate(
      template,
      { layoutProps: { html: "", title: "My Title" } },
      "<title>My Title</title>\n<meta name='description' content='Test'>",
      "<div>Content</div>",
      "/__bundles/test.js",
    );

    expect(html).toContain("<title>My Title</title>");
    expect(html).toContain("<meta name='description' content='Test'>");
  });

  it("should inject body content in app wrapper", async () => {
    const template = await loadHtmlTemplate("/nonexistent");

    const html = renderWithTemplate(
      template,
      { layoutProps: { html: "", title: "Test" } },
      "",
      "<main><h1>Hello</h1><p>World</p></main>",
      "/__bundles/test.js",
    );

    expect(html).toContain('<div id="app" data-mage-content="true">');
    expect(html).toContain("<main><h1>Hello</h1><p>World</p></main>");
    expect(html).toContain("</div>");
  });

  it("should inject bundle script with correct URL", async () => {
    const template = await loadHtmlTemplate("/nonexistent");

    const html = renderWithTemplate(
      template,
      { layoutProps: { html: "", title: "Test", description: "Test page" } },
      "<title>Test</title>",
      "<div>Content</div>",
      "/__bundles/test-abc123.js",
    );

    expect(html).toContain("window.__PAGE_PROPS__");
    expect(html).toContain('"title":"Test"');
    expect(html).toContain('"description":"Test page"');
    expect(html).toContain(
      '<script type="module" src="/__bundles/test-abc123.js">',
    );
  });

  it("should inject props script before bundle script", async () => {
    const template = await loadHtmlTemplate("/nonexistent");

    const html = renderWithTemplate(
      template,
      { layoutProps: { html: "", title: "Test" } },
      "<title>Test</title>",
      "<div>Content</div>",
      "/__bundles/test.js",
    );

    expect(html).toContain("window.__PAGE_PROPS__");
    expect(html).toContain('<script type="module"');

    // Props script should come before bundle script
    const propsIndex = html.indexOf("window.__PAGE_PROPS__");
    const bundleIndex = html.indexOf('<script type="module"');
    expect(propsIndex).toBeLessThan(bundleIndex);
  });

  it("should serialize props correctly including additionalFrontmatter", async () => {
    const template = await loadHtmlTemplate("/nonexistent");

    const html = renderWithTemplate(
      template,
      {
        layoutProps: {
          html: "<p>Layout content</p>",
          title: "Test Page",
          description: "Test description",
          additionalFrontmatter: {
            customField: "custom value",
          },
        },
      },
      "",
      "<div>Content</div>",
      "/__bundles/test.js",
    );

    // Props should be serialized
    expect(html).toContain('"title":"Test Page"');
    expect(html).toContain('"description":"Test description"');
    expect(html).toContain('"customField":"custom value"');

    // html field should NOT be included (extracted from DOM on client)
    expect(html).not.toContain('"html":"<p>Layout content</p>"');
  });
});

describe("html-template - custom template", () => {
  it("should use custom template structure and inject content", async () => {
    const template = await loadHtmlTemplate(FIXTURES_DIR);

    const html = renderWithTemplate(
      template,
      { layoutProps: { html: "", title: "Custom" } },
      "<title>Custom</title>",
      "<div>Custom body</div>",
      "/__bundles/custom.js",
    );

    // Custom template should have its own structure
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Custom</title>");
    expect(html).toContain("<div>Custom body</div>");
    // Injected elements should still be present
    expect(html).toContain('<div id="app" data-mage-content="true">');
    expect(html).toContain("window.__PAGE_PROPS__");
  });

  it("should allow conditional rendering based on props", async () => {
    const template = await loadHtmlTemplate("/nonexistent");

    const html = renderWithTemplate(
      template,
      {
        layoutProps: {
          html: "",
          title: "Test",
          additionalFrontmatter: { darkMode: true },
        },
      },
      "",
      "<div>Content</div>",
      "/__bundles/test.js",
    );

    // Template receives props for conditional logic
    expect(html).toContain("<!DOCTYPE html>");
  });
});
