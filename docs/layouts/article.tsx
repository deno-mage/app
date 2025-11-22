import type { LayoutProps } from "../../pages/mod.ts";
import { Head } from "../../pages/head.tsx";
import { Container } from "../components/container.tsx";
import { Footer } from "../components/footer.tsx";
import { Header } from "../components/header.tsx";

export default function ArticleLayout(props: LayoutProps) {
  return (
    <>
      <Head>
        <title>{props.title}</title>
      </Head>
      <Header />
      <Container>
        <main
          data-mage-layout
          dangerouslySetInnerHTML={{ __html: props.html }}
          className="prose dark:prose-invert"
        />
      </Container>
      <Footer />
    </>
  );
}
