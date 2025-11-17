import type { LayoutProps } from "../../../mod.ts";

export function Layout(props: LayoutProps) {
  const navItems = props.navigation.default || [];
  return (
    <>
      <nav>{navItems.length > 0 && <ul>{navItems.length} sections</ul>}</nav>
      <div dangerouslySetInnerHTML={{ __html: props.articleHtml }} />
    </>
  );
}
