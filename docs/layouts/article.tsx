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
  {
    title: "Core Concepts",
    items: [
      { label: "Routing", href: "/routing" },
      { label: "Layouts", href: "/layouts" },
      { label: "Pages", href: "/pages" },
    ],
  },
  {
    title: "Advanced",
    items: [
      { label: "Middleware", href: "/middleware" },
      { label: "SSR", href: "/ssr" },
    ],
  },
  { label: "API Reference", href: "/api" },
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
            className="flex-1 prose dark:prose-invert max-w-3xl px-6 lg:px-0 pt-6"
            dangerouslySetInnerHTML={{ __html: props.html }}
          >
          </article>
          <aside className="hidden lg:block w-64 flex-shrink-0 pt-6">
            <ArticleToc />
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
