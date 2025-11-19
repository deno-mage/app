import type { LayoutProps } from "../../../types.ts";
import { Head } from "../../../head.tsx";

export default function DefaultLayout(props: LayoutProps) {
  return (
    <>
      <Head>
        <title>{props.title}</title>
        {props.description && (
          <meta name="description" content={props.description} />
        )}
        <link rel="stylesheet" href="/public/styles.css" />
      </Head>

      <article
        data-article-html="true"
        dangerouslySetInnerHTML={{ __html: props.html }}
      />
    </>
  );
}
