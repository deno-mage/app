import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { renderTemplate, type TemplateData } from "../template.ts";

describe("markdown-app - template", () => {
  describe("renderTemplate", () => {
    it("should replace single {{key}} pattern", () => {
      const template = "<h1>{{title}}</h1>";
      const data: TemplateData = {
        title: "Test Page",
        content: "",
        navigation: "",
        basePath: "",
      };

      const result = renderTemplate(template, data);

      expect(result).toBe("<h1>Test Page</h1>");
    });

    it("should replace multiple {{key}} patterns", () => {
      const template = "<title>{{title}}</title><body>{{content}}</body>";
      const data: TemplateData = {
        title: "Test Page",
        content: "<p>Hello World</p>",
        navigation: "",
        basePath: "",
      };

      const result = renderTemplate(template, data);

      expect(result).toBe(
        "<title>Test Page</title><body><p>Hello World</p></body>",
      );
    });

    it("should replace all standard template data fields", () => {
      const template = `
<!DOCTYPE html>
<html>
  <head>
    <title>{{title}}</title>
    <link rel="stylesheet" href="{{basePath}}/styles.css">
  </head>
  <body>
    <nav>{{navigation}}</nav>
    <main>{{content}}</main>
  </body>
</html>
      `.trim();

      const data: TemplateData = {
        title: "My Page",
        content: "<p>Content here</p>",
        navigation: "<ul><li>Home</li></ul>",
        basePath: "/docs",
      };

      const result = renderTemplate(template, data);

      expect(result).toContain("<title>My Page</title>");
      expect(result).toContain(
        '<link rel="stylesheet" href="/docs/styles.css">',
      );
      expect(result).toContain("<nav><ul><li>Home</li></ul></nav>");
      expect(result).toContain("<main><p>Content here</p></main>");
    });

    it("should replace custom keys", () => {
      const template = '<meta name="author" content="{{author}}">';
      const data: TemplateData = {
        title: "Test",
        content: "",
        navigation: "",
        basePath: "",
        author: "John Doe",
      };

      const result = renderTemplate(template, data);

      expect(result).toBe('<meta name="author" content="John Doe">');
    });

    it("should replace same key multiple times", () => {
      const template = "<h1>{{title}}</h1><title>{{title}}</title>";
      const data: TemplateData = {
        title: "Test Page",
        content: "",
        navigation: "",
        basePath: "",
      };

      const result = renderTemplate(template, data);

      expect(result).toBe("<h1>Test Page</h1><title>Test Page</title>");
    });

    it("should return empty string for undefined keys", () => {
      const template = "<div>{{nonexistent}}</div>";
      const data: TemplateData = {
        title: "Test",
        content: "",
        navigation: "",
        basePath: "",
      };

      const result = renderTemplate(template, data);

      expect(result).toBe("<div></div>");
    });

    it("should handle empty template", () => {
      const template = "";
      const data: TemplateData = {
        title: "Test",
        content: "",
        navigation: "",
        basePath: "",
      };

      const result = renderTemplate(template, data);

      expect(result).toBe("");
    });

    it("should handle template with no placeholders", () => {
      const template = "<h1>Static Content</h1>";
      const data: TemplateData = {
        title: "Test",
        content: "",
        navigation: "",
        basePath: "",
      };

      const result = renderTemplate(template, data);

      expect(result).toBe("<h1>Static Content</h1>");
    });

    it("should handle empty string values", () => {
      const template = "<title>{{title}}</title><body>{{content}}</body>";
      const data: TemplateData = {
        title: "",
        content: "",
        navigation: "",
        basePath: "",
      };

      const result = renderTemplate(template, data);

      expect(result).toBe("<title></title><body></body>");
    });

    it("should not replace malformed patterns", () => {
      const template = "{{title} {title}} {{title";
      const data: TemplateData = {
        title: "Test",
        content: "",
        navigation: "",
        basePath: "",
      };

      const result = renderTemplate(template, data);

      expect(result).toBe("{{title} {title}} {{title");
    });

    it("should handle basePath normalization use case", () => {
      const template = '<link rel="stylesheet" href="{{basePath}}/gfm.css">';

      // Root basePath (normalized to empty string)
      const data1: TemplateData = {
        title: "Test",
        content: "",
        navigation: "",
        basePath: "",
      };

      const result1 = renderTemplate(template, data1);
      expect(result1).toBe('<link rel="stylesheet" href="/gfm.css">');

      // Non-root basePath
      const data2: TemplateData = {
        title: "Test",
        content: "",
        navigation: "",
        basePath: "/docs",
      };

      const result2 = renderTemplate(template, data2);
      expect(result2).toBe('<link rel="stylesheet" href="/docs/gfm.css">');
    });

    it("should handle complex HTML content", () => {
      const template = "<main>{{content}}</main>";
      const data: TemplateData = {
        title: "Test",
        content: `
<h1 id="heading">Heading</h1>
<p>Paragraph with <strong>bold</strong> and <em>italic</em>.</p>
<pre><code class="language-typescript">const x = 1;</code></pre>
        `.trim(),
        navigation: "",
        basePath: "",
      };

      const result = renderTemplate(template, data);

      expect(result).toContain('<h1 id="heading">Heading</h1>');
      expect(result).toContain("<strong>bold</strong>");
      expect(result).toContain(
        '<code class="language-typescript">const x = 1;</code>',
      );
    });

    it("should handle navigation HTML", () => {
      const template = "<nav>{{navigation}}</nav>";
      const data: TemplateData = {
        title: "Test",
        content: "",
        navigation: `
<ul>
  <li><a href="/guide">Guide</a>
    <ul>
      <li><a href="/guide/getting-started" data-current="true">Getting Started</a></li>
    </ul>
  </li>
</ul>
        `.trim(),
        basePath: "",
      };

      const result = renderTemplate(template, data);

      expect(result).toContain('<a href="/guide">Guide</a>');
      expect(result).toContain('data-current="true"');
    });

    it("should only match word characters and dots in keys", () => {
      // Template with non-word characters (except dots) should not match
      const template = "{{title-dashed}} {{navigation.dotted}} {{title:colon}}";
      const data: TemplateData = {
        title: "Test",
        content: "",
        navigation: { dotted: "Dotted Value" },
        basePath: "",
      };

      const result = renderTemplate(template, data);

      // {{navigation.dotted}} should be replaced (dots are supported for nested access)
      // {{title-dashed}} and {{title:colon}} should not (hyphens and colons not supported)
      expect(result).toBe("{{title-dashed}} Dotted Value {{title:colon}}");
    });
  });
});
