import type { LayoutProps } from "../../../mod.ts";

export function Layout(props: LayoutProps) {
  return <main dangerouslySetInnerHTML={{ __html: props.articleHtml }} />;
}
