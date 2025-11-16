import type { LayoutProps } from "../../../mod.ts";

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
