import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { renderJsxLayout } from "../jsx-renderer.ts";
import type { TemplateData } from "../template.ts";
import { join } from "@std/path";

describe("markdown-app - jsx-renderer", () => {
  describe("renderJsxLayout", () => {
    it("should render a valid JSX layout to HTML", async () => {
      // Create a temporary layout file
      const tempDir = await Deno.makeTempDir();
      const layoutPath = join(tempDir, "_layout-test.tsx");

      const layoutContent = `
import type { TemplateData } from "../template.ts";

export function Layout(data: TemplateData) {
  return (
    <html>
      <head>
        <title>{data.title}</title>
      </head>
      <body>
        <h1>{data.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: data.content }} />
      </body>
    </html>
  );
}
`;

      await Deno.writeTextFile(layoutPath, layoutContent);

      const templateData: TemplateData = {
        title: "Test Page",
        content: "<p>Hello World</p>",
        navigation: {},
        basePath: "",
      };

      const html = await renderJsxLayout(layoutPath, templateData);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<title>Test Page</title>");
      expect(html).toContain("<h1>Test Page</h1>");
      expect(html).toContain("<p>Hello World</p>");

      // Cleanup
      await Deno.remove(tempDir, { recursive: true });
    });

    it("should throw error if Layout export is missing", async () => {
      const tempDir = await Deno.makeTempDir();
      const layoutPath = join(tempDir, "_layout-bad.tsx");

      const layoutContent = `
export function WrongName() {
  return <div>Wrong</div>;
}
`;

      await Deno.writeTextFile(layoutPath, layoutContent);

      const templateData: TemplateData = {
        title: "Test",
        content: "<p>Content</p>",
        navigation: {},
        basePath: "",
      };

      try {
        await expect(renderJsxLayout(layoutPath, templateData)).rejects.toThrow(
          'must export a "Layout" component',
        );
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });

    it("should handle file:// URLs correctly", async () => {
      const tempDir = await Deno.makeTempDir();
      const layoutPath = join(tempDir, "_layout-fileurl.tsx");

      const layoutContent = `
export function Layout(data: { title: string }) {
  return <html><head><title>{data.title}</title></head><body></body></html>;
}
`;

      await Deno.writeTextFile(layoutPath, layoutContent);

      // Test with file:// URL
      const fileUrl = `file://${layoutPath}`;
      const templateData: TemplateData = {
        title: "File URL Test",
        content: "",
        navigation: {},
        basePath: "",
      };

      const html = await renderJsxLayout(fileUrl, templateData);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<title>File URL Test</title>");

      await Deno.remove(tempDir, { recursive: true });
    });

    it("should pass navigation data to layout", async () => {
      const tempDir = await Deno.makeTempDir();
      const layoutPath = join(tempDir, "_layout-nav.tsx");

      const layoutContent = `
import type { TemplateData } from "../template.ts";

export function Layout(data: TemplateData) {
  const navItems = data.navigation.default || [];
  return (
    <html>
      <body>
        <nav>
          {navItems.length > 0 && <ul>{navItems.length} sections</ul>}
        </nav>
        <div dangerouslySetInnerHTML={{ __html: data.content }} />
      </body>
    </html>
  );
}
`;

      await Deno.writeTextFile(layoutPath, layoutContent);

      const templateData: TemplateData = {
        title: "Nav Test",
        content: "<p>Content</p>",
        navigation: {
          default: [
            {
              title: "Section 1",
              order: 1,
              items: [],
            },
            {
              title: "Section 2",
              order: 2,
              items: [],
            },
          ],
        },
        basePath: "",
      };

      const html = await renderJsxLayout(layoutPath, templateData);

      expect(html).toContain("2 sections");

      await Deno.remove(tempDir, { recursive: true });
    });

    it("should pass basePath to layout", async () => {
      const tempDir = await Deno.makeTempDir();
      const layoutPath = join(tempDir, "_layout-basepath.tsx");

      const layoutContent = `
import type { TemplateData } from "../template.ts";

export function Layout(data: TemplateData) {
  return (
    <html>
      <body>
        <a href={\`\${data.basePath}/home\`}>Home</a>
      </body>
    </html>
  );
}
`;

      await Deno.writeTextFile(layoutPath, layoutContent);

      const templateData: TemplateData = {
        title: "Base Path Test",
        content: "",
        navigation: {},
        basePath: "/docs",
      };

      const html = await renderJsxLayout(layoutPath, templateData);

      expect(html).toContain('href="/docs/home"');

      await Deno.remove(tempDir, { recursive: true });
    });
  });
});
