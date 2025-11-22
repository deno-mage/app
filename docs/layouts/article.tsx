import type { LayoutProps } from "../../pages/mod.ts";
import { Head } from "../../pages/mod.ts";
import { Container } from "../components/container.tsx";
import { Footer } from "../components/footer.tsx";
import { Header } from "../components/header.tsx";

export default function ArticleLayout(props: LayoutProps) {
  return (
    <>
      <Head>
        <title>{props.title}</title>
      </Head>
      <body className="bg-zinc-50 dark:bg-zinc-900">
        <Header />
        <Container>
          <main
            data-mage-layout
            dangerouslySetInnerHTML={{ __html: props.html }}
            className="prose dark:prose-invert"
          />
        </Container>
        <Footer />
      </body>
    </>
  );
}
