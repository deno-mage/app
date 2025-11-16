export interface LayoutProps {
  title: string;
  articleHtml: string;
  description?: string;
  navigation: {
    default?: Array<{
      title: string;
      items: Array<{
        slug: string;
        href: string;
        title: string;
        isCurrent?: boolean;
      }>;
    }>;
  };
  basePath: string;
}

export function Layout({ articleHtml, navigation }: LayoutProps) {
  return (
    <>
      {navigation.default?.map((section) => (
        <nav key={section.title}>
          {section.items.map((item) => (
            <a
              key={item.slug}
              href={item.href}
              aria-current={item.isCurrent ? "page" : undefined}
            >
              {item.title}
            </a>
          ))}
        </nav>
      ))}
      <main dangerouslySetInnerHTML={{ __html: articleHtml }} />
    </>
  );
}
