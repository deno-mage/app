import type { LayoutProps } from "../../../mod.ts";

export function Layout(data: LayoutProps) {
  return (
    <>
      <h1>{data.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: data.articleHtml }} />
    </>
  );
}
