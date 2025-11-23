import type { LayoutProps } from "../../pages/mod.ts";
import { Head } from "../../pages/head.tsx";
import { Footer } from "../components/footer.tsx";
import { Header } from "../components/header.tsx";

export default function ArticleLayout(props: LayoutProps) {
  return (
    <>
      <Head>
        <title>{props.title}</title>
      </Head>
      <Header />
      <main
        data-mage-layout
        dangerouslySetInnerHTML={{ __html: props.html }}
        className="px-6 prose dark:prose-invert"
      />
      <Footer />
    </>
  );
}
