import type { LayoutProps } from "../../../mod.ts";

export function Layout(props: LayoutProps) {
  return (
    <>
      <h1>{props.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: props.articleHtml }} />
    </>
  );
}
