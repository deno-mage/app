export interface LayoutProps {
  title: string;
  articleHtml: string;
  description?: string;
  navigation: Record<string, unknown>;
  basePath: string;
}

export function Layout(data: LayoutProps) {
  return <main dangerouslySetInnerHTML={{ __html: data.articleHtml }} />;
}
