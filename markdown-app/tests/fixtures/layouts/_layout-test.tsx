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
      <h1>{data.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: data.articleHtml }} />
    </>
  );
}
