/**
 * Tests for SSR rendering orchestration.
 *
 * @module
 */

import { expect } from "@std/expect";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import type { ComponentChildren } from "preact";
import { renderToHtml, renderTsxPage } from "../renderer.tsx";
import type { SystemFiles } from "../types.ts";
import { resolve } from "@std/path";
import { Head } from "../head.tsx";

const FIXTURES_DIR = resolve(import.meta.dirname!, "fixtures");

describe("Renderer", () => {
  describe("renderToHtml", () => {
    it("should render VNode tree to HTML", () => {
      const tree = (
        <div>
          <h1>Test Page</h1>
          <p>Content here</p>
        </div>
      );

      const result = renderToHtml(tree);

      expect(result.html).toContain("<div>");
      expect(result.html).toContain("<h1>Test Page</h1>");
      expect(result.html).toContain("<p>Content here</p>");
    });

    it("should extract head content from tree", () => {
      const tree = (
        <div>
          <Head>
            <title>Page Title</title>
            <meta name="description" content="Test description" />
          </Head>
          <main>Content</main>
        </div>
      );

      const result = renderToHtml(tree);

      expect(result.headContent).toContain("<title>Page Title</title>");
      expect(result.headContent).toContain(
        '<meta name="description" content="Test description"/>',
      );
      expect(result.html).not.toContain("<mage-head");
      expect(result.html).toContain("<main>Content</main>");
    });

    it("should handle multiple Head components", () => {
      const tree = (
        <div>
          <Head>
            <link rel="stylesheet" href="/base.css" />
          </Head>
          <main>
            <Head>
              <title>Nested Title</title>
            </Head>
            <p>Content</p>
          </main>
        </div>
      );

      const result = renderToHtml(tree);

      expect(result.headContent).toContain(
        '<link rel="stylesheet" href="/base.css"/>',
      );
      expect(result.headContent).toContain("<title>Nested Title</title>");
    });

    it("should return empty headContent when no Head components", () => {
      const tree = (
        <div>
          <p>Simple content</p>
        </div>
      );

      const result = renderToHtml(tree);

      expect(result.headContent).toBe("");
      expect(result.html).toBe("<div><p>Simple content</p></div>");
    });

    it("should handle complex component trees", () => {
      function Layout({ children }: { children: ComponentChildren }) {
        return (
          <div class="layout">
            <Head>
              <link rel="stylesheet" href="/layout.css" />
            </Head>
            <header>Header</header>
            <main>{children}</main>
          </div>
        );
      }

      function Page() {
        return (
          <article>
            <Head>
              <title>Article Title</title>
            </Head>
            <h1>Article</h1>
          </article>
        );
      }

      const tree = (
        <Layout>
          <Page />
        </Layout>
      );

      const result = renderToHtml(tree);

      expect(result.headContent).toContain(
        '<link rel="stylesheet" href="/layout.css"/>',
      );
      expect(result.headContent).toContain("<title>Article Title</title>");
      expect(result.html).toContain("<header>Header</header>");
      expect(result.html).toContain("<h1>Article</h1>");
    });
  });

  describe("renderTsxPage", () => {
    let tempDir: string;
    let systemFiles: SystemFiles;

    beforeEach(async () => {
      // Create temp directory for test pages
      tempDir = await Deno.makeTempDir({ prefix: "pages_test_" });

      // Default system files (no custom layouts or templates)
      systemFiles = {
        layouts: [],
      };
    });

    afterEach(async () => {
      // Clean up temp directory
      try {
        await Deno.remove(tempDir, { recursive: true });
      } catch {
        // Ignore errors during cleanup
      }
    });

    it("should render complete HTML document with DOCTYPE", async () => {
      const pagePath = resolve(FIXTURES_DIR, "valid-page.tsx");
      const result = await renderTsxPage({
        pagePath,
        pagesDir: FIXTURES_DIR,
        systemFiles,
      });

      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.html).toContain("<html");
      expect(result.html).toContain("<head>");
      expect(result.html).toContain("<body>");
    });

    it("should include page frontmatter in result", async () => {
      const pagePath = resolve(FIXTURES_DIR, "valid-page.tsx");
      const result = await renderTsxPage({
        pagePath,
        pagesDir: FIXTURES_DIR,
        systemFiles,
      });

      expect(result.frontmatter.title).toBe("Getting Started Guide");
      expect(result.frontmatter.description).toBe(
        "Learn how to get started with our platform",
      );
      expect(result.frontmatter.author).toBe("Jane Smith");
    });

    it("should render page content in body", async () => {
      const pagePath = resolve(FIXTURES_DIR, "valid-page.tsx");
      const result = await renderTsxPage({
        pagePath,
        pagesDir: FIXTURES_DIR,
        systemFiles,
      });

      expect(result.html).toContain("<article>");
      expect(result.html).toContain("<h1>Getting Started</h1>");
      expect(result.html).toContain("<p>Welcome to our platform!</p>");
    });

    it("should include title in head from frontmatter", async () => {
      const pagePath = resolve(FIXTURES_DIR, "valid-page.tsx");
      const result = await renderTsxPage({
        pagePath,
        pagesDir: FIXTURES_DIR,
        systemFiles,
      });

      expect(result.html).toContain("<title>Getting Started Guide</title>");
    });

    it("should include description meta tag when provided", async () => {
      const pagePath = resolve(FIXTURES_DIR, "valid-page.tsx");
      const result = await renderTsxPage({
        pagePath,
        pagesDir: FIXTURES_DIR,
        systemFiles,
      });

      expect(result.html).toContain(
        '<meta name="description" content="Learn how to get started with our platform"/>',
      );
    });

    it("should use default layout when none provided", async () => {
      const pagePath = resolve(FIXTURES_DIR, "valid-page.tsx");
      const result = await renderTsxPage({
        pagePath,
        pagesDir: FIXTURES_DIR,
        systemFiles,
      });

      // Default layout is pass-through, so page content should be present
      expect(result.html).toContain("<article>");
    });

    it("should render with custom layout", async () => {
      const layoutPath = resolve(FIXTURES_DIR, "valid-layout.tsx");
      const pagePath = resolve(FIXTURES_DIR, "valid-page.tsx");

      systemFiles.layouts = [
        {
          filePath: layoutPath,
          directory: "",
          depth: 0,
        },
      ];

      const result = await renderTsxPage({
        pagePath,
        pagesDir: FIXTURES_DIR,
        systemFiles,
      });

      // Valid layout adds header/footer
      expect(result.html).toContain("<header>");
      expect(result.html).toContain("<nav>Navigation</nav>");
      expect(result.html).toContain("<footer>Footer</footer>");
      expect(result.html).toContain("<article>");
    });

    it("should hoist head content into head and remove from body", async () => {
      // Create a test page with Head component
      const testPagePath = resolve(tempDir, "test-page.tsx");
      await Deno.writeTextFile(
        testPagePath,
        `
        export const frontmatter = {
          title: "Test Page",
        };

        import { Head } from "${resolve(import.meta.dirname!, "../head.tsx")}";

        export default function TestPage() {
          return (
            <article>
              <Head>
                <meta property="og:title" content="Test Page" />
                <link rel="stylesheet" href="/custom.css" />
              </Head>
              <h1>Test Content</h1>
            </article>
          );
        }
        `,
      );

      const result = await renderTsxPage({
        pagePath: testPagePath,
        pagesDir: tempDir,
        systemFiles,
      });

      // Extract head and body sections
      const headMatch = result.html.match(/<head>([\s\S]*?)<\/head>/);
      const bodyMatch = result.html.match(/<body>([\s\S]*?)<\/body>/);

      expect(headMatch).not.toBeNull();
      expect(bodyMatch).not.toBeNull();

      const headSection = headMatch![1];
      const bodySection = bodyMatch![1];

      // Head content should be in <head>
      expect(headSection).toContain(
        '<meta property="og:title" content="Test Page"/>',
      );
      expect(headSection).toContain(
        '<link rel="stylesheet" href="/custom.css"/>',
      );

      // Head content should NOT be in <body>
      expect(bodySection).not.toContain('property="og:title"');
      expect(bodySection).not.toContain('href="/custom.css"');

      // Markers should be removed entirely
      expect(result.html).not.toContain("<mage-head");

      // Page content should still be in body
      expect(bodySection).toContain("<h1>Test Content</h1>");
    });

    it("should handle nested layouts in correct order", async () => {
      const layoutPath = resolve(FIXTURES_DIR, "valid-layout.tsx");
      const pagePath = resolve(FIXTURES_DIR, "valid-page.tsx");

      systemFiles.layouts = [
        {
          filePath: layoutPath,
          directory: "",
          depth: 0,
        },
        {
          filePath: layoutPath,
          directory: "docs",
          depth: 1,
        },
      ];

      const result = await renderTsxPage({
        pagePath,
        pagesDir: FIXTURES_DIR,
        systemFiles,
      });

      // Should compose layouts but for this test both use same layout file
      expect(result.html).toContain("<header>");
      expect(result.html).toContain("<footer>");
    });

    it("should throw PageLoadError for invalid page", async () => {
      const pagePath = resolve(FIXTURES_DIR, "missing-frontmatter.tsx");

      try {
        await renderTsxPage({
          pagePath,
          pagesDir: FIXTURES_DIR,
          systemFiles,
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain("Failed to load page");
      }
    });

    it("should include charset meta tag", async () => {
      const pagePath = resolve(FIXTURES_DIR, "valid-page.tsx");
      const result = await renderTsxPage({
        pagePath,
        pagesDir: FIXTURES_DIR,
        systemFiles,
      });

      expect(result.html).toContain('<meta charset="UTF-8"/>');
    });

    it("should include viewport meta tag", async () => {
      const pagePath = resolve(FIXTURES_DIR, "valid-page.tsx");
      const result = await renderTsxPage({
        pagePath,
        pagesDir: FIXTURES_DIR,
        systemFiles,
      });

      expect(result.html).toContain(
        '<meta name="viewport" content="width=device-width, initial-scale=1.0"/>',
      );
    });

    it("should handle page without description", async () => {
      // Create page without description
      const testPagePath = resolve(tempDir, "minimal-page.tsx");
      await Deno.writeTextFile(
        testPagePath,
        `
        export const frontmatter = {
          title: "Minimal Page",
        };

        export default function MinimalPage() {
          return <div>Minimal content</div>;
        }
        `,
      );

      const result = await renderTsxPage({
        pagePath: testPagePath,
        pagesDir: tempDir,
        systemFiles,
      });

      expect(result.html).toContain("<title>Minimal Page</title>");
      expect(result.html).not.toContain('name="description"');
    });

    it("should make frontmatter accessible to page via context", async () => {
      // Create page that uses frontmatter
      const testPagePath = resolve(tempDir, "context-page.tsx");
      await Deno.writeTextFile(
        testPagePath,
        `
        export const frontmatter = {
          title: "Context Test",
          author: "Jane Smith",
        };

        import { useFrontmatter } from "${
          resolve(import.meta.dirname!, "../context.tsx")
        }";

        export default function ContextPage() {
          const fm = useFrontmatter();
          return <div>Author: {fm.author}</div>;
        }
        `,
      );

      const result = await renderTsxPage({
        pagePath: testPagePath,
        pagesDir: tempDir,
        systemFiles,
      });

      expect(result.html).toContain("Author: Jane Smith");
    });

    it("should merge head content from layout and page", async () => {
      // Create layout with Head
      const layoutPath = resolve(tempDir, "layout-with-head.tsx");
      await Deno.writeTextFile(
        layoutPath,
        `
        import { Head } from "${resolve(import.meta.dirname!, "../head.tsx")}";

        export default function LayoutWithHead({ children }) {
          return (
            <div class="layout">
              <Head>
                <link rel="stylesheet" href="/layout.css" />
              </Head>
              <main>{children}</main>
            </div>
          );
        }
        `,
      );

      // Create page with Head
      const pagePath = resolve(tempDir, "page-with-head.tsx");
      await Deno.writeTextFile(
        pagePath,
        `
        export const frontmatter = {
          title: "Page with Head",
        };

        import { Head } from "${resolve(import.meta.dirname!, "../head.tsx")}";

        export default function PageWithHead() {
          return (
            <article>
              <Head>
                <meta property="og:type" content="article" />
              </Head>
              <h1>Article</h1>
            </article>
          );
        }
        `,
      );

      systemFiles.layouts = [
        {
          filePath: layoutPath,
          directory: "",
          depth: 0,
        },
      ];

      const result = await renderTsxPage({
        pagePath,
        pagesDir: tempDir,
        systemFiles,
      });

      // Both head contents should be included
      expect(result.html).toContain(
        '<link rel="stylesheet" href="/layout.css"/>',
      );
      expect(result.html).toContain(
        '<meta property="og:type" content="article"/>',
      );
      expect(result.html).not.toContain("<mage-head");
    });

    it("should use default HTML template when none provided", async () => {
      const pagePath = resolve(FIXTURES_DIR, "valid-page.tsx");
      const result = await renderTsxPage({
        pagePath,
        pagesDir: FIXTURES_DIR,
        systemFiles,
      });

      // Default template includes lang="en"
      expect(result.html).toContain('<html lang="en">');
    });

    it("should handle pages in subdirectories", async () => {
      // Create subdirectory
      const subDir = resolve(tempDir, "docs", "guides");
      await Deno.mkdir(subDir, { recursive: true });

      const pagePath = resolve(subDir, "installation.tsx");
      await Deno.writeTextFile(
        pagePath,
        `
        export const frontmatter = {
          title: "Installation Guide",
        };

        export default function Installation() {
          return <article>Install instructions</article>;
        }
        `,
      );

      const result = await renderTsxPage({
        pagePath,
        pagesDir: tempDir,
        systemFiles,
      });

      expect(result.html).toContain("<title>Installation Guide</title>");
      expect(result.html).toContain("<article>Install instructions</article>");
    });
  });

  describe("integration", () => {
    it("should render complete page with layout and head content", async () => {
      const tempDir = await Deno.makeTempDir({ prefix: "integration_test_" });

      try {
        // Create layout
        const layoutPath = resolve(tempDir, "_layout.tsx");
        await Deno.writeTextFile(
          layoutPath,
          `
          import { Head } from "${
            resolve(import.meta.dirname!, "../head.tsx")
          }";
          import { useFrontmatter } from "${
            resolve(import.meta.dirname!, "../context.tsx")
          }";

          export default function Layout({ children }) {
            const fm = useFrontmatter();
            return (
              <div class="site-layout">
                <Head>
                  <link rel="stylesheet" href="/base.css" />
                  <meta property="og:site_name" content="Test Site" />
                </Head>
                <header>
                  <h1>{fm.title}</h1>
                </header>
                <main>{children}</main>
                <footer>Footer</footer>
              </div>
            );
          }
          `,
        );

        // Create page
        const pagePath = resolve(tempDir, "about.tsx");
        await Deno.writeTextFile(
          pagePath,
          `
          export const frontmatter = {
            title: "About Us",
            description: "Learn about our company",
          };

          import { Head } from "${
            resolve(import.meta.dirname!, "../head.tsx")
          }";

          export default function About() {
            return (
              <article>
                <Head>
                  <meta property="og:type" content="website" />
                  <link rel="canonical" href="https://example.com/about" />
                </Head>
                <section>
                  <h2>Our Story</h2>
                  <p>We started in 2025...</p>
                </section>
              </article>
            );
          }
          `,
        );

        const systemFiles: SystemFiles = {
          layouts: [
            {
              filePath: layoutPath,
              directory: "",
              depth: 0,
            },
          ],
        };

        const result = await renderTsxPage({
          pagePath,
          pagesDir: tempDir,
          systemFiles,
        });

        // Verify complete document structure
        expect(result.html).toContain("<!DOCTYPE html>");
        expect(result.html).toContain('<html lang="en">');

        // Verify head content merged from both sources
        expect(result.html).toContain("<title>About Us</title>");
        expect(result.html).toContain(
          '<meta name="description" content="Learn about our company"/>',
        );
        expect(result.html).toContain(
          '<link rel="stylesheet" href="/base.css"/>',
        );
        expect(result.html).toContain(
          '<meta property="og:site_name" content="Test Site"/>',
        );
        expect(result.html).toContain(
          '<meta property="og:type" content="website"/>',
        );
        expect(result.html).toContain(
          '<link rel="canonical" href="https://example.com/about"/>',
        );

        // Verify layout structure
        expect(result.html).toContain('<div class="site-layout">');
        expect(result.html).toContain("<header>");
        expect(result.html).toContain("<h1>About Us</h1>");
        expect(result.html).toContain("<footer>Footer</footer>");

        // Verify page content
        expect(result.html).toContain("<h2>Our Story</h2>");
        expect(result.html).toContain("<p>We started in 2025...</p>");

        // Verify no markers remain
        expect(result.html).not.toContain("<mage-head");

        // Verify frontmatter
        expect(result.frontmatter.title).toBe("About Us");
        expect(result.frontmatter.description).toBe("Learn about our company");
      } finally {
        await Deno.remove(tempDir, { recursive: true });
      }
    });
  });
});
