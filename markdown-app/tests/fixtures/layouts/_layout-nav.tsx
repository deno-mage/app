import type { LayoutProps } from "../../../mod.ts";

export function Layout(data: LayoutProps) {
  const navItems = data.navigation.default || [];
  return (
    <>
      <nav>
        {navItems.length > 0 && <ul>{navItems.length} sections</ul>}
      </nav>
      <div dangerouslySetInnerHTML={{ __html: data.articleHtml }} />
    </>
  );
}
