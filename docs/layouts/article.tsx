import type { LayoutProps } from "../../pages/mod.ts";
import { Head } from "../../pages/head.tsx";
import { Footer } from "../components/footer.tsx";
import { Header } from "../components/header.tsx";
import { ArticleToc } from "../components/article-toc.tsx";

export default function ArticleLayout(props: LayoutProps) {
  return (
    <>
      <Head>
        <title>{props.title}</title>
      </Head>
      <Header />
      <main className="max-w-7xl mx-auto px-6">
        <div className="flex gap-8">
          <article
            id="mage-article"
            data-mage-content
            className="flex-1 prose dark:prose-invert max-w-3xl"
            dangerouslySetInnerHTML={{ __html: props.html }}
          >
          </article>
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <ArticleToc />
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
