export interface LayoutProps {
  title: string;
  articleHtml: string;
  description?: string;
  navigation: {
    default?: Array<unknown>;
  };
  basePath: string;
}

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
