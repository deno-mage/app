import { Head, type LayoutProps } from "../../../mod.ts";

export function Layout(props: LayoutProps) {
  return (
    <>
      <Head>
        <title>{props.title}</title>
      </Head>
      <div>Some content</div>
      <Head>
        <meta name="description" content="Second head block" />
      </Head>
      <main dangerouslySetInnerHTML={{ __html: props.articleHtml }} />
      <Head>
        <link rel="stylesheet" href="/custom.css" />
      </Head>
    </>
  );
}
