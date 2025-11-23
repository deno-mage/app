import type { LayoutProps } from "../../pages/mod.ts";
import { Head } from "../../pages/head.tsx";
import { Footer } from "../components/footer.tsx";
import { Header } from "../components/header.tsx";
import { ArticleToc } from "../components/article-toc.tsx";
import { SideNav } from "../components/side-nav.tsx";

const navigationItems = [
  { label: "Introduction", href: "/" },
  { label: "Installation", href: "/installation" },
  { label: "Getting started", href: "/getting-started" },
  { label: "Philosophy", href: "/philosophy" },
  {
    title: "Core",
    items: [
      { label: "MageApp", href: "/core/mage-app" },
      { label: "Routing", href: "/core/routing" },
      { label: "MageContext", href: "/core/mage-context" },
      { label: "Middleware", href: "/core/middleware" },
      { label: "MageRequest", href: "/core/mage-request" },
      { label: "MageResponse", href: "/mage-response" },
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
    title: "Utillities",
    items: [{ label: "Cookies", href: "/advanced/cookies" }],
  },
  {
    title: "Advanced",
    items: [
      { label: "Testing", href: "/advanced/testing" },
      { label: "Error handling", href: "/advanced/error-handling" },
    ],
  },
  {
    title: "Pages",
    items: [
      { label: "Overview", href: "/pages/overview" },
      { label: "Getting started", href: "/pages/getting-started" },
      { label: "Routing", href: "/pages/routing" },
      { label: "Markdown pages", href: "/pages/markdown-pages" },
      { label: "Layouts", href: "/pages/layouts" },
      { label: "Styles", href: "/pages/styles" },
      { label: "Static assets", href: "/pages/static-assets" },
      { label: "Head management", href: "/pages/head-management" },
      { label: "HTML", href: "/pages/html" },
      { label: "Not found", href: "/pages/not-found" },
      { label: "Error", href: "/pages/error" },
    ],
  },
];

export default function ArticleLayout(props: LayoutProps) {
  return (
    <>
      <Head>
        <title>{props.title}</title>
      </Head>
      <Header />
      <main className="max-w-7xl mx-auto">
        <div className="flex gap-8">
          <SideNav items={navigationItems} />
          <article
            id="mage-article"
            data-mage-content
            className="flex-1 min-w-0 prose dark:prose-invert px-6 lg:px-0 pt-6"
            dangerouslySetInnerHTML={{ __html: props.html }}
          />
          <ArticleToc />
        </div>
      </main>
      <Footer />
    </>
  );
}
