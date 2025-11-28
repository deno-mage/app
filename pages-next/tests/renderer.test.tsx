/**
 * Tests for SSR rendering orchestration.
 *
 * @module
 */

import { expect } from "@std/expect";
import { beforeEach, describe, it } from "@std/testing/bdd";
import type { ComponentChildren } from "preact";
import {
  HtmlTemplateError,
  renderMarkdownPage,
  renderPage,
  renderToHtml,
  renderTsxPage,
} from "../renderer.tsx";
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

  describe("HtmlTemplateError", () => {
    it("should create error with template path and reason", () => {
      const error = new HtmlTemplateError(
        "/app/pages/_html.tsx",
        "Something went wrong",
      );

      expect(error.name).toBe("HtmlTemplateError");
      expect(error.templatePath).toBe("/app/pages/_html.tsx");
      expect(error.reason).toBe("Something went wrong");
      expect(error.message).toBe(
        'Failed to load HTML template "/app/pages/_html.tsx": Something went wrong',
      );
    });

    it("should create error with cause and include cause message", () => {
      const cause = new Error("Original error");
      const error = new HtmlTemplateError(
        "/app/pages/_html.tsx",
        "Import failed",
        cause,
      );

      expect(error.cause).toBe(cause);
      expect(error.message).toContain("Original error");
    });

    it("should be instance of Error", () => {
      const error = new HtmlTemplateError(
        "/app/pages/_html.tsx",
        "Test reason",
      );
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("custom HTML template", () => {
    it("should use custom _html.tsx template when provided", async () => {
      const tempDir = await Deno.makeTempDir({ prefix: "html_template_test_" });

      // Create custom HTML template
      const htmlTemplatePath = resolve(tempDir, "_html.tsx");
      await Deno.writeTextFile(
        htmlTemplatePath,
        `
        export default function CustomHtml({ title, description, children }) {
          return (
            <html lang="fr">
              <head>
                <meta charset="UTF-8" />
                <title>{title}</title>
                {description && <meta name="description" content={description} />}
                <meta name="custom-template" content="true" />
              </head>
              <body class="custom-body">{children}</body>
            </html>
          );
        }
        `,
      );

      // Create a simple page
      const pagePath = resolve(tempDir, "test.tsx");
      await Deno.writeTextFile(
        pagePath,
        `
        export const frontmatter = { title: "Test Page" };
        export default function TestPage() {
          return <div>Test content</div>;
        }
        `,
      );

      const systemFiles: SystemFiles = {
        layouts: [],
        htmlTemplate: htmlTemplatePath,
      };

      const result = await renderTsxPage({
        pagePath,
        pagesDir: tempDir,
        systemFiles,
      });

      // Custom template uses lang="fr" instead of lang="en"
      expect(result.html).toContain('<html lang="fr">');
      expect(result.html).toContain(
        '<meta name="custom-template" content="true"/>',
      );
      expect(result.html).toContain('class="custom-body"');
    });

    it("should throw HtmlTemplateError for non-function default export", async () => {
      const tempDir = await Deno.makeTempDir({ prefix: "html_template_test_" });

      // Create invalid HTML template (object instead of function)
      const htmlTemplatePath = resolve(tempDir, "_html.tsx");
      await Deno.writeTextFile(
        htmlTemplatePath,
        `
        export default { notAFunction: true };
        `,
      );

      // Create a simple page
      const pagePath = resolve(tempDir, "test.tsx");
      await Deno.writeTextFile(
        pagePath,
        `
        export const frontmatter = { title: "Test Page" };
        export default function TestPage() {
          return <div>Test content</div>;
        }
        `,
      );

      const systemFiles: SystemFiles = {
        layouts: [],
        htmlTemplate: htmlTemplatePath,
      };

      try {
        await renderTsxPage({
          pagePath,
          pagesDir: tempDir,
          systemFiles,
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(HtmlTemplateError);
        expect((error as HtmlTemplateError).reason).toContain(
          "Default export must be a function",
        );
        expect((error as HtmlTemplateError).reason).toContain("got object");
      }
    });

    it("should throw HtmlTemplateError for non-existent template", async () => {
      const tempDir = await Deno.makeTempDir({ prefix: "html_template_test_" });

      // Create a simple page
      const pagePath = resolve(tempDir, "test.tsx");
      await Deno.writeTextFile(
        pagePath,
        `
        export const frontmatter = { title: "Test Page" };
        export default function TestPage() {
          return <div>Test content</div>;
        }
        `,
      );

      const systemFiles: SystemFiles = {
        layouts: [],
        htmlTemplate: resolve(tempDir, "does-not-exist.tsx"),
      };

      try {
        await renderTsxPage({
          pagePath,
          pagesDir: tempDir,
          systemFiles,
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(HtmlTemplateError);
        expect((error as HtmlTemplateError).reason).toContain(
          "Failed to import module",
        );
      }
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
    it("should render complete TSX page with layout and head content", async () => {
      const tempDir = await Deno.makeTempDir({ prefix: "integration_test_" });

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
    });

    it("should render complete Markdown page with layout and head content", async () => {
      const tempDir = await Deno.makeTempDir({ prefix: "integration_test_" });

      // Create layout with Head component
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
              <div class="docs-layout">
                <Head>
                  <link rel="stylesheet" href="/docs.css" />
                  <meta property="og:site_name" content="Mage Docs" />
                </Head>
                <nav>
                  <a href="/">Home</a>
                </nav>
                <article>
                  <h1>{fm.title}</h1>
                  {children}
                </article>
                <footer>Documentation Footer</footer>
              </div>
            );
          }
          `,
      );

      // Create markdown page
      const pagePath = resolve(tempDir, "getting-started.md");
      await Deno.writeTextFile(
        pagePath,
        `---
title: Getting Started
description: Learn how to use the framework
author: John Doe
---

## Installation

Install the package using npm:

\`\`\`bash
npm install mage
\`\`\`

## Quick Start

Here's a simple example:

\`\`\`typescript
import { MageApp } from "mage";

const app = new MageApp();
app.start();
\`\`\`

That's all you need to get started!
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

      const result = await renderMarkdownPage({
        pagePath,
        pagesDir: tempDir,
        systemFiles,
      });

      // Verify complete document structure
      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.html).toContain('<html lang="en">');

      // Verify head content from layout and frontmatter
      expect(result.html).toContain("<title>Getting Started</title>");
      expect(result.html).toContain(
        '<meta name="description" content="Learn how to use the framework"/>',
      );
      expect(result.html).toContain(
        '<link rel="stylesheet" href="/docs.css"/>',
      );
      expect(result.html).toContain(
        '<meta property="og:site_name" content="Mage Docs"/>',
      );

      // Verify layout structure
      expect(result.html).toContain('<div class="docs-layout">');
      expect(result.html).toContain("<nav>");
      expect(result.html).toContain("<h1>Getting Started</h1>");
      expect(result.html).toContain("<footer>Documentation Footer</footer>");

      // Verify markdown content is rendered
      expect(result.html).toContain("Installation</h2>");
      expect(result.html).toContain("Quick Start</h2>");
      expect(result.html).toContain("That's all you need to get started!");

      // Verify code blocks are syntax highlighted (Shiki output)
      expect(result.html).toContain("<pre");
      expect(result.html).toContain("shiki"); // Shiki class
      expect(result.html).toContain("github-dark"); // Theme class

      // Verify no markers remain
      expect(result.html).not.toContain("<mage-head");

      // Verify frontmatter includes custom fields
      expect(result.frontmatter.title).toBe("Getting Started");
      expect(result.frontmatter.description).toBe(
        "Learn how to use the framework",
      );
      expect(result.frontmatter.author).toBe("John Doe");
    });

    it("should auto-detect page type with renderPage", async () => {
      const tempDir = await Deno.makeTempDir({ prefix: "integration_test_" });

      // Create TSX page
      const tsxPath = resolve(tempDir, "about.tsx");
      await Deno.writeTextFile(
        tsxPath,
        `
          export const frontmatter = { title: "About TSX" };
          export default function About() {
            return <div>TSX content</div>;
          }
          `,
      );

      // Create Markdown page
      const mdPath = resolve(tempDir, "readme.md");
      await Deno.writeTextFile(
        mdPath,
        `---
title: About MD
---

Markdown content
`,
      );

      const systemFiles: SystemFiles = { layouts: [] };

      // Render TSX via renderPage
      const tsxResult = await renderPage({
        pagePath: tsxPath,
        pagesDir: tempDir,
        systemFiles,
      });
      expect(tsxResult.html).toContain("<title>About TSX</title>");
      expect(tsxResult.html).toContain("<div>TSX content</div>");

      // Render Markdown via renderPage
      const mdResult = await renderPage({
        pagePath: mdPath,
        pagesDir: tempDir,
        systemFiles,
      });
      expect(mdResult.html).toContain("<title>About MD</title>");
      expect(mdResult.html).toContain("Markdown content");
    });

    it("should throw for unsupported file extension", async () => {
      const systemFiles: SystemFiles = { layouts: [] };

      try {
        await renderPage({
          pagePath: "/app/pages/file.html",
          pagesDir: "/app/pages",
          systemFiles,
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain("Unsupported page type");
        expect((error as Error).message).toContain(".html");
      }
    });
  });
});
