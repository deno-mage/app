/**
 * Tests for page and layout composition.
 *
 * @module
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { render } from "preact-render-to-string";
import type { ComponentChildren } from "preact";
import { composePage, composeWithLayout } from "../compositor.tsx";
import { useFrontmatter } from "../context.tsx";
import type { Frontmatter, LayoutComponent } from "../types.ts";
import type { LoadedLayout } from "../layout-loader.ts";

describe("Compositor", () => {
  describe("composePage", () => {
    it("should wrap page in single layout", () => {
      const frontmatter: Frontmatter = {
        title: "Test Page",
      };

      function Layout({ children }: { children: ComponentChildren }) {
        return (
          <div class="layout">
            <header>Header</header>
            <main>{children}</main>
          </div>
        );
      }

      const layouts: LoadedLayout[] = [
        { component: Layout, directory: "", depth: 0 },
      ];

      const page = <article>Page content</article>;
      const composed = composePage(page, layouts, frontmatter);
      const html = render(composed);

      expect(html).toContain('<div class="layout">');
      expect(html).toContain("<header>Header</header>");
      expect(html).toContain("<main>");
      expect(html).toContain("<article>Page content</article>");
    });

    it("should wrap page in nested layouts in correct order", () => {
      const frontmatter: Frontmatter = {
        title: "Nested Page",
      };

      function RootLayout({ children }: { children: ComponentChildren }) {
        return (
          <div class="root-layout">
            <div class="root-content">{children}</div>
          </div>
        );
      }

      function DocsLayout({ children }: { children: ComponentChildren }) {
        return (
          <div class="docs-layout">
            <nav>Docs Nav</nav>
            <div class="docs-content">{children}</div>
          </div>
        );
      }

      function ApiLayout({ children }: { children: ComponentChildren }) {
        return (
          <div class="api-layout">
            <aside>API Sidebar</aside>
            <div class="api-content">{children}</div>
          </div>
        );
      }

      const layouts: LoadedLayout[] = [
        { component: RootLayout, directory: "", depth: 0 },
        { component: DocsLayout, directory: "docs", depth: 1 },
        { component: ApiLayout, directory: "docs/api", depth: 2 },
      ];

      const page = <article>API Endpoint</article>;
      const composed = composePage(page, layouts, frontmatter);
      const html = render(composed);

      // Verify nesting order: root outermost, api innermost
      const rootIndex = html.indexOf('class="root-layout"');
      const docsIndex = html.indexOf('class="docs-layout"');
      const apiIndex = html.indexOf('class="api-layout"');
      const pageIndex = html.indexOf("<article>");

      expect(rootIndex).toBeLessThan(docsIndex);
      expect(docsIndex).toBeLessThan(apiIndex);
      expect(apiIndex).toBeLessThan(pageIndex);
    });

    it("should provide frontmatter via context to all components", () => {
      const frontmatter: Frontmatter = {
        title: "Context Test",
        description: "Testing context",
        author: "Jane Smith",
      };

      function Layout({ children }: { children: ComponentChildren }) {
        const fm = useFrontmatter();
        return (
          <div>
            <h1>{fm.title}</h1>
            {children}
          </div>
        );
      }

      function Page() {
        const fm = useFrontmatter();
        return <p>{fm.description}</p>;
      }

      const layouts: LoadedLayout[] = [
        { component: Layout, directory: "", depth: 0 },
      ];

      const composed = composePage(<Page />, layouts, frontmatter);
      const html = render(composed);

      expect(html).toContain("<h1>Context Test</h1>");
      expect(html).toContain("<p>Testing context</p>");
    });

    it("should handle empty layouts array", () => {
      const frontmatter: Frontmatter = {
        title: "No Layouts",
      };

      const page = <div>Standalone page</div>;
      const composed = composePage(page, [], frontmatter);
      const html = render(composed);

      expect(html).toBe("<div>Standalone page</div>");
    });

    it("should handle page as VNode", () => {
      const frontmatter: Frontmatter = {
        title: "VNode Page",
      };

      function Page() {
        return <article>Page as VNode</article>;
      }

      const composed = composePage(<Page />, [], frontmatter);
      const html = render(composed);

      expect(html).toContain("<article>Page as VNode</article>");
    });

    it("should handle page as text", () => {
      const frontmatter: Frontmatter = {
        title: "Text Page",
      };

      const composed = composePage("Simple text content", [], frontmatter);
      const html = render(composed);

      expect(html).toBe("Simple text content");
    });

    it("should allow nested components to access frontmatter", () => {
      interface CustomFrontmatter extends Frontmatter {
        tags: string[];
      }

      const frontmatter: CustomFrontmatter = {
        title: "Blog Post",
        tags: ["typescript", "testing"],
      };

      function Layout({ children }: { children: ComponentChildren }) {
        return <div class="layout">{children}</div>;
      }

      function Page() {
        const fm = useFrontmatter<CustomFrontmatter>();
        return (
          <article>
            <h1>{fm.title}</h1>
            <ul>
              {fm.tags.map((tag) => <li key={tag}>{tag}</li>)}
            </ul>
          </article>
        );
      }

      const layouts: LoadedLayout[] = [
        { component: Layout, directory: "", depth: 0 },
      ];

      const composed = composePage(<Page />, layouts, frontmatter);
      const html = render(composed);

      expect(html).toContain("<h1>Blog Post</h1>");
      expect(html).toContain("<li>typescript</li>");
      expect(html).toContain("<li>testing</li>");
    });

    it("should compose with three levels of layouts", () => {
      const frontmatter: Frontmatter = {
        title: "Deep Nesting",
      };

      function Level1({ children }: { children: ComponentChildren }) {
        return <div class="level-1">{children}</div>;
      }

      function Level2({ children }: { children: ComponentChildren }) {
        return <div class="level-2">{children}</div>;
      }

      function Level3({ children }: { children: ComponentChildren }) {
        return <div class="level-3">{children}</div>;
      }

      const layouts: LoadedLayout[] = [
        { component: Level1, directory: "", depth: 0 },
        { component: Level2, directory: "a", depth: 1 },
        { component: Level3, directory: "a/b", depth: 2 },
      ];

      const page = <p>Deep content</p>;
      const composed = composePage(page, layouts, frontmatter);
      const html = render(composed);

      expect(html).toContain('class="level-1"');
      expect(html).toContain('class="level-2"');
      expect(html).toContain('class="level-3"');
      expect(html).toContain("<p>Deep content</p>");
    });

    it("should maintain layout metadata in LoadedLayout objects", () => {
      const frontmatter: Frontmatter = {
        title: "Metadata Test",
      };

      function SimpleLayout({ children }: { children: ComponentChildren }) {
        return <div>{children}</div>;
      }

      const layouts: LoadedLayout[] = [
        {
          component: SimpleLayout,
          directory: "docs/guides",
          depth: 2,
        },
      ];

      // Verify metadata is preserved
      expect(layouts[0].directory).toBe("docs/guides");
      expect(layouts[0].depth).toBe(2);

      const composed = composePage(<p>Content</p>, layouts, frontmatter);
      expect(composed).toBeDefined();
    });
  });

  describe("composeWithLayout", () => {
    it("should compose page with single layout", () => {
      const frontmatter: Frontmatter = {
        title: "Single Layout",
      };

      function Layout({ children }: { children: ComponentChildren }) {
        return (
          <div class="wrapper">
            <nav>Navigation</nav>
            <main>{children}</main>
          </div>
        );
      }

      const page = <article>Page content</article>;
      const composed = composeWithLayout(page, Layout, frontmatter);
      const html = render(composed);

      expect(html).toContain('<div class="wrapper">');
      expect(html).toContain("<nav>Navigation</nav>");
      expect(html).toContain("<article>Page content</article>");
    });

    it("should handle null layout", () => {
      const frontmatter: Frontmatter = {
        title: "No Layout",
      };

      const page = <div>Bare page</div>;
      const composed = composeWithLayout(page, null, frontmatter);
      const html = render(composed);

      expect(html).toBe("<div>Bare page</div>");
    });

    it("should provide frontmatter via context", () => {
      const frontmatter: Frontmatter = {
        title: "Context Layout",
        description: "Testing context in composeWithLayout",
      };

      function Layout({ children }: { children: ComponentChildren }) {
        const fm = useFrontmatter();
        return (
          <div>
            <h1>{fm.title}</h1>
            {children}
          </div>
        );
      }

      function Page() {
        const fm = useFrontmatter();
        return <p>{fm.description}</p>;
      }

      const composed = composeWithLayout(<Page />, Layout, frontmatter);
      const html = render(composed);

      expect(html).toContain("<h1>Context Layout</h1>");
      expect(html).toContain("<p>Testing context in composeWithLayout</p>");
    });

    it("should work with LayoutComponent type", () => {
      const frontmatter: Frontmatter = {
        title: "Type Test",
      };

      const Layout: LayoutComponent = ({ children }) => {
        return <section>{children}</section>;
      };

      const composed = composeWithLayout(<p>Content</p>, Layout, frontmatter);
      const html = render(composed);

      expect(html).toContain("<section>");
      expect(html).toContain("<p>Content</p>");
    });

    it("should handle complex page components", () => {
      const frontmatter: Frontmatter = {
        title: "Complex Page",
      };

      function Layout({ children }: { children: ComponentChildren }) {
        return <div class="layout">{children}</div>;
      }

      function Page() {
        const fm = useFrontmatter();
        return (
          <article>
            <header>
              <h1>{fm.title}</h1>
            </header>
            <section>
              <p>Paragraph 1</p>
              <p>Paragraph 2</p>
            </section>
            <footer>Footer content</footer>
          </article>
        );
      }

      const composed = composeWithLayout(<Page />, Layout, frontmatter);
      const html = render(composed);

      expect(html).toContain("<h1>Complex Page</h1>");
      expect(html).toContain("<p>Paragraph 1</p>");
      expect(html).toContain("<footer>Footer content</footer>");
    });

    it("should handle custom frontmatter fields", () => {
      interface BlogFrontmatter extends Frontmatter {
        author: string;
        publishDate: string;
      }

      const frontmatter: BlogFrontmatter = {
        title: "Blog Post",
        author: "Jane Smith",
        publishDate: "2025-11-28",
      };

      function Page() {
        const fm = useFrontmatter<BlogFrontmatter>();
        return (
          <article>
            <h1>{fm.title}</h1>
            <p>By {fm.author} on {fm.publishDate}</p>
          </article>
        );
      }

      const composed = composeWithLayout(<Page />, null, frontmatter);
      const html = render(composed);

      expect(html).toContain("<h1>Blog Post</h1>");
      expect(html).toContain("By Jane Smith on 2025-11-28");
    });
  });

  describe("integration", () => {
    it("should compose page with layouts and provide working context", () => {
      interface DocsFrontmatter extends Frontmatter {
        category: string;
        version: string;
      }

      const frontmatter: DocsFrontmatter = {
        title: "Installation Guide",
        description: "How to install",
        category: "Getting Started",
        version: "1.0.0",
      };

      function RootLayout({ children }: { children: ComponentChildren }) {
        const fm = useFrontmatter<DocsFrontmatter>();
        return (
          <html>
            <head>
              <title>{fm.title}</title>
            </head>
            <body>{children}</body>
          </html>
        );
      }

      function DocsLayout({ children }: { children: ComponentChildren }) {
        const fm = useFrontmatter<DocsFrontmatter>();
        return (
          <div class="docs">
            <aside>Version: {fm.version}</aside>
            <main>{children}</main>
          </div>
        );
      }

      function Page() {
        const fm = useFrontmatter<DocsFrontmatter>();
        return (
          <article>
            <h1>{fm.title}</h1>
            <p class="category">Category: {fm.category}</p>
            <p>{fm.description}</p>
          </article>
        );
      }

      const layouts: LoadedLayout[] = [
        { component: RootLayout, directory: "", depth: 0 },
        { component: DocsLayout, directory: "docs", depth: 1 },
      ];

      const composed = composePage(<Page />, layouts, frontmatter);
      const html = render(composed);

      expect(html).toContain("<title>Installation Guide</title>");
      expect(html).toContain("Version: 1.0.0");
      expect(html).toContain("<h1>Installation Guide</h1>");
      expect(html).toContain("Category: Getting Started");
      expect(html).toContain("<p>How to install</p>");
    });
  });
});
