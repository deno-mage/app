import type { LayoutProps } from "../../../mod.ts";

export function Layout(data: LayoutProps) {
  return <main dangerouslySetInnerHTML={{ __html: data.articleHtml }} />;
}
