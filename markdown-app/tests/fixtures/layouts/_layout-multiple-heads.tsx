import type { ComponentChildren } from "preact";

// Inline Head component to avoid import issues in test fixtures
function Head({ children }: { children?: ComponentChildren }) {
  return <head>{children}</head>;
}

export interface LayoutProps {
  title: string;
  articleHtml: string;
  description?: string;
  navigation: Record<string, unknown>;
  basePath: string;
}

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
