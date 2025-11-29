/**
 * Tests for Head component.
 *
 * @module
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { render } from "preact-render-to-string";
import type { ComponentChildren } from "preact";
import { Head, HEAD_MARKER_ELEMENT } from "../head.tsx";

describe("Head", () => {
  describe("SSR rendering", () => {
    it("should render marker element during SSR", () => {
      const html = render(
        <Head>
          <title>Test Page</title>
          <meta name="description" content="Test description" />
        </Head>,
      );

      expect(html).toContain(`<${HEAD_MARKER_ELEMENT}>`);
      expect(html).toContain("<title>Test Page</title>");
      expect(html).toContain(
        '<meta name="description" content="Test description"/>',
      );
    });

    it("should render single child element", () => {
      const html = render(
        <Head>
          <link rel="stylesheet" href="/styles.css" />
        </Head>,
      );

      expect(html).toContain("<mage-head");
      expect(html).toContain('<link rel="stylesheet" href="/styles.css"/>');
    });

    it("should render multiple child elements", () => {
      const html = render(
        <Head>
          <title>My Page</title>
          <meta property="og:title" content="My Page" />
          <meta property="og:description" content="A great page" />
          <link rel="icon" href="/favicon.ico" />
        </Head>,
      );

      expect(html).toContain("<title>My Page</title>");
      expect(html).toContain('<meta property="og:title" content="My Page"/>');
      expect(html).toContain(
        '<meta property="og:description" content="A great page"/>',
      );
      expect(html).toContain('<link rel="icon" href="/favicon.ico"/>');
    });

    it("should render nested elements", () => {
      const html = render(
        <Head>
          <style>
            {`
              body { margin: 0; }
              .container { max-width: 1200px; }
            `}
          </style>
        </Head>,
      );

      expect(html).toContain("<style>");
      expect(html).toContain("body { margin: 0; }");
      expect(html).toContain(".container { max-width: 1200px; }");
    });

    it("should handle script tags", () => {
      const html = render(
        <Head>
          <script src="/analytics.js" />
          <script>
            {`console.log('Hello');`}
          </script>
        </Head>,
      );

      expect(html).toContain('<script src="/analytics.js"></script>');
      expect(html).toContain("console.log('Hello');");
    });

    it("should render with marker element", () => {
      const html = render(
        <Head>
          <title>Test</title>
        </Head>,
      );

      expect(html).toContain(`<${HEAD_MARKER_ELEMENT}>`);
      expect(html).toContain(`</${HEAD_MARKER_ELEMENT}>`);
    });

    it("should wrap all children in single marker element", () => {
      const html = render(
        <Head>
          <title>Title 1</title>
          <title>Title 2</title>
          <meta name="test" />
        </Head>,
      );

      // Count occurrences of opening tag
      const matches = html.match(/<mage-head/g);
      expect(matches).toHaveLength(1);
    });
  });

  describe("client-side behavior", () => {
    it("should return null when document exists", () => {
      // Simulate client-side by setting document
      const originalDocument = globalThis.document;
      try {
        // @ts-expect-error - simulating browser environment
        globalThis.document = {};

        const result = Head({
          children: <title>Test</title>,
        });

        expect(result).toBeNull();
      } finally {
        // Restore original document
        globalThis.document = originalDocument;
      }
    });
  });

  describe("HEAD_MARKER_ELEMENT", () => {
    it("should export constant for marker element", () => {
      expect(HEAD_MARKER_ELEMENT).toBe("mage-head");
    });

    it("should be a string", () => {
      expect(typeof HEAD_MARKER_ELEMENT).toBe("string");
    });
  });

  describe("integration scenarios", () => {
    it("should handle empty children", () => {
      const html = render(<Head>{null}</Head>);
      expect(html).toContain("<mage-head");
      expect(html).toContain("</mage-head>");
    });

    it("should handle text content", () => {
      const html = render(
        <Head>
          <title>Page Title</title>
        </Head>,
      );

      expect(html).toContain("Page Title");
    });

    it("should render in layout component", () => {
      function Layout({ children }: { children: ComponentChildren }) {
        return (
          <div>
            <Head>
              <title>Layout Title</title>
              <link rel="stylesheet" href="/layout.css" />
            </Head>
            <main>{children}</main>
          </div>
        );
      }

      const html = render(
        <Layout>
          <p>Content</p>
        </Layout>,
      );

      expect(html).toContain("<mage-head");
      expect(html).toContain("<title>Layout Title</title>");
      expect(html).toContain('<link rel="stylesheet" href="/layout.css"/>');
      expect(html).toContain("<p>Content</p>");
    });

    it("should render in page component", () => {
      function Page() {
        return (
          <article>
            <Head>
              <meta property="og:type" content="article" />
            </Head>
            <h1>Article Title</h1>
          </article>
        );
      }

      const html = render(<Page />);

      expect(html).toContain("<mage-head");
      expect(html).toContain('<meta property="og:type" content="article"/>');
      expect(html).toContain("<h1>Article Title</h1>");
    });

    it("should handle multiple Head components", () => {
      function Layout({ children }: { children: ComponentChildren }) {
        return (
          <>
            <Head>
              <link rel="stylesheet" href="/base.css" />
            </Head>
            {children}
          </>
        );
      }

      function Page() {
        return (
          <>
            <Head>
              <title>Page Title</title>
            </Head>
            <h1>Content</h1>
          </>
        );
      }

      const html = render(
        <Layout>
          <Page />
        </Layout>,
      );

      // Should have two separate marker elements
      const matches = html.match(/<mage-head/g);
      expect(matches).toHaveLength(2);
      expect(html).toContain('<link rel="stylesheet" href="/base.css"/>');
      expect(html).toContain("<title>Page Title</title>");
    });
  });
});
