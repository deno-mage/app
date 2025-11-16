import { Head, type LayoutProps } from "../../../mod.ts";

export function Layout(data: LayoutProps) {
  return (
    <>
      <Head>
        <title>{data.title}</title>
      </Head>
      <div>Some content</div>
      <Head>
        <meta name="description" content="Second head block" />
      </Head>
      <main dangerouslySetInnerHTML={{ __html: data.articleHtml }} />
      <Head>
        <link rel="stylesheet" href="/custom.css" />
      </Head>
    </>
  );
}
