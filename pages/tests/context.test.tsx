/**
 * Tests for FrontmatterContext and useFrontmatter hook.
 *
 * @module
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { render } from "preact-render-to-string";
import { FrontmatterProvider, useFrontmatter } from "../context.tsx";
import type { Frontmatter } from "../types.ts";

describe("FrontmatterContext", () => {
  describe("FrontmatterProvider", () => {
    it("should render children with frontmatter context", () => {
      const frontmatter: Frontmatter = {
        title: "Test Page",
        description: "Test description",
      };

      const html = render(
        <FrontmatterProvider frontmatter={frontmatter}>
          <div>Page content</div>
        </FrontmatterProvider>,
      );

      expect(html).toBe("<div>Page content</div>");
    });

    it("should pass frontmatter to children through context", () => {
      const frontmatter: Frontmatter = {
        title: "Advanced Guide",
        description: "An advanced guide for testing",
        author: "Jane Smith",
      };

      function TestComponent() {
        const fm = useFrontmatter();
        return <h1>{fm.title}</h1>;
      }

      const html = render(
        <FrontmatterProvider frontmatter={frontmatter}>
          <TestComponent />
        </FrontmatterProvider>,
      );

      expect(html).toBe("<h1>Advanced Guide</h1>");
    });

    it("should handle nested providers with inner value taking precedence", () => {
      const outerFrontmatter: Frontmatter = {
        title: "Outer",
      };

      const innerFrontmatter: Frontmatter = {
        title: "Inner",
      };

      function TestComponent() {
        const fm = useFrontmatter();
        return <span>{fm.title}</span>;
      }

      const html = render(
        <FrontmatterProvider frontmatter={outerFrontmatter}>
          <FrontmatterProvider frontmatter={innerFrontmatter}>
            <TestComponent />
          </FrontmatterProvider>
        </FrontmatterProvider>,
      );

      expect(html).toBe("<span>Inner</span>");
    });

    it("should handle custom frontmatter fields", () => {
      interface CustomFrontmatter extends Frontmatter {
        tags: string[];
        publishDate: string;
      }

      const frontmatter: CustomFrontmatter = {
        title: "Blog Post",
        description: "A blog post about testing",
        tags: ["testing", "typescript", "deno"],
        publishDate: "2025-11-27",
      };

      function TestComponent() {
        const fm = useFrontmatter<CustomFrontmatter>();
        return (
          <div>
            <h1>{fm.title}</h1>
            <p>{fm.tags.join(", ")}</p>
          </div>
        );
      }

      const html = render(
        <FrontmatterProvider frontmatter={frontmatter}>
          <TestComponent />
        </FrontmatterProvider>,
      );

      expect(html).toBe(
        "<div><h1>Blog Post</h1><p>testing, typescript, deno</p></div>",
      );
    });

    it("should handle frontmatter without description", () => {
      const frontmatter: Frontmatter = {
        title: "Minimal Page",
      };

      function TestComponent() {
        const fm = useFrontmatter();
        return (
          <div>
            <h1>{fm.title}</h1>
            {fm.description && <p>{fm.description}</p>}
          </div>
        );
      }

      const html = render(
        <FrontmatterProvider frontmatter={frontmatter}>
          <TestComponent />
        </FrontmatterProvider>,
      );

      expect(html).toBe("<div><h1>Minimal Page</h1></div>");
    });
  });

  describe("useFrontmatter", () => {
    it("should throw error when used outside FrontmatterProvider", () => {
      function TestComponent() {
        const fm = useFrontmatter();
        return <div>{fm.title}</div>;
      }

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useFrontmatter must be used within a FrontmatterProvider");
    });

    it("should throw error with helpful message", () => {
      function TestComponent() {
        const fm = useFrontmatter();
        return <div>{fm.title}</div>;
      }

      try {
        render(<TestComponent />);
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("FrontmatterProvider");
        expect((error as Error).message).toContain(
          "Ensure your page is wrapped",
        );
      }
    });

    it("should return frontmatter when inside provider", () => {
      const frontmatter: Frontmatter = {
        title: "API Documentation",
        description: "Complete API reference",
      };

      function TestComponent() {
        const fm = useFrontmatter();
        expect(fm).toBeDefined();
        expect(fm.title).toBe("API Documentation");
        expect(fm.description).toBe("Complete API reference");
        return <div>Test</div>;
      }

      render(
        <FrontmatterProvider frontmatter={frontmatter}>
          <TestComponent />
        </FrontmatterProvider>,
      );
    });

    it("should work with type parameter", () => {
      interface BlogFrontmatter extends Frontmatter {
        author: string;
        publishDate: string;
        tags: string[];
      }

      const frontmatter: BlogFrontmatter = {
        title: "Testing Best Practices",
        description: "Learn how to write great tests",
        author: "Jane Smith",
        publishDate: "2025-11-27",
        tags: ["testing", "best-practices"],
      };

      function BlogPost() {
        const fm = useFrontmatter<BlogFrontmatter>();
        return (
          <article>
            <h1>{fm.title}</h1>
            <p>By {fm.author} on {fm.publishDate}</p>
            <ul>
              {fm.tags.map((tag) => <li key={tag}>{tag}</li>)}
            </ul>
          </article>
        );
      }

      const html = render(
        <FrontmatterProvider frontmatter={frontmatter}>
          <BlogPost />
        </FrontmatterProvider>,
      );

      expect(html).toContain("Testing Best Practices");
      expect(html).toContain("Jane Smith");
      expect(html).toContain("2025-11-27");
      expect(html).toContain("testing");
      expect(html).toContain("best-practices");
    });

    it("should access frontmatter from deeply nested components", () => {
      const frontmatter: Frontmatter = {
        title: "Nested Component Test",
      };

      function DeepChild() {
        const fm = useFrontmatter();
        return <span>{fm.title}</span>;
      }

      function MiddleComponent() {
        return (
          <div>
            <DeepChild />
          </div>
        );
      }

      function ParentComponent() {
        return (
          <section>
            <MiddleComponent />
          </section>
        );
      }

      const html = render(
        <FrontmatterProvider frontmatter={frontmatter}>
          <ParentComponent />
        </FrontmatterProvider>,
      );

      expect(html).toContain("Nested Component Test");
    });
  });
});
