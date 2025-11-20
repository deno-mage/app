import type { LayoutProps } from "../../../types.ts";
import { Head } from "../../../head.tsx";

export default function ArticleLayout(props: LayoutProps) {
  return (
    <>
      <Head>
        <title>{props.title}</title>
        {props.description && (
          <meta name="description" content={props.description} />
        )}
      </Head>

      <article>
        <h1>{props.title}</h1>
        <div
          data-mage-layout="true"
          dangerouslySetInnerHTML={{ __html: props.html }}
        />
      </article>
    </>
  );
}
