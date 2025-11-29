import type { LayoutProps } from "../../pages/mod.ts";
import { Head } from "../../pages/head.tsx";
import { useFrontmatter } from "../../pages/context.tsx";
import { Footer } from "../components/footer.tsx";
import { Header } from "../components/header.tsx";
import { ArticleToc } from "../components/article-toc.tsx";
import { SideNav } from "../components/side-nav.tsx";
import { useEffect } from "preact/hooks";

const navigationItems = [
  {
    title: "Welcome",
    items: [
      { label: "Introduction", href: "/" },
      { label: "Installation", href: "/installation" },
      { label: "Getting started", href: "/getting-started" },
      { label: "Philosophy", href: "/philosophy" },
    ],
  },
  {
    title: "Core",
    items: [
      { label: "MageApp", href: "/core/mage-app" },
      { label: "Routing", href: "/core/routing" },
      { label: "MageContext", href: "/core/mage-context" },
      { label: "Middleware", href: "/core/middleware" },
      { label: "Request & Response", href: "/core/request-response" },
      { label: "Error handling", href: "/core/error-handling" },
    ],
  },
  {
    title: "Middleware",
    items: [
      { label: "Body size", href: "/middleware/body-size" },
      { label: "Cache control", href: "/middleware/cache-control" },
      { label: "Compression", href: "/middleware/compression" },
      { label: "CORS", href: "/middleware/cors" },
      { label: "CSP", href: "/middleware/csp" },
      { label: "CSRF", href: "/middleware/csrf" },
      { label: "Rate limit", href: "/middleware/rate-limit" },
      { label: "Request ID", href: "/middleware/request-id" },
      { label: "Security headers", href: "/middleware/security-headers" },
      { label: "Serve files", href: "/middleware/serve-files" },
      { label: "Timeout", href: "/middleware/timeout" },
      { label: "Validate", href: "/middleware/validate" },
    ],
  },
  {
    title: "Utilities",
    items: [{ label: "Cookies", href: "/utilities/cookies" }],
  },
  {
    title: "Testing",
    items: [{ label: "Guidelines", href: "/testing/guidelines" }],
  },
  {
    title: "Pages",
    items: [
      { label: "Overview", href: "/pages/overview" },
      { label: "Getting started", href: "/pages/getting-started" },
      { label: "Markdown", href: "/pages/markdown" },
      { label: "Layouts", href: "/pages/layouts" },
      { label: "Styles", href: "/pages/styles" },
      { label: "Assets", href: "/pages/assets" },
      { label: "HTML template", href: "/pages/html-template" },
      { label: "Error pages", href: "/pages/error-pages" },
    ],
  },
];

export default function ArticleLayout(props: LayoutProps) {
  const frontmatter = useFrontmatter();

  useEffect(() => {
    // Scroll to the main content area, respecting scroll-padding-top
    const main = document.querySelector("main");
    if (main) {
      main.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, [frontmatter.title]);

  return (
    <>
      <Head>
        <title>{frontmatter.title}</title>
        <meta name="description" content={frontmatter.description} />
      </Head>
      <Header />
      <main className="max-w-7xl mx-auto">
        <div className="flex lg:gap-8">
          <SideNav items={navigationItems} />
          <article
            id="mage-article"
            data-mage-content
            className="flex-1 min-w-0 prose dark:prose-invert px-6 lg:px-0 pt-6"
          >
            {props.children}
          </article>
          <ArticleToc />
        </div>
      </main>
      <Footer />
    </>
  );
}
