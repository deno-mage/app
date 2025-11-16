import type { TemplateData } from "../../../template.ts";

export function Layout({ title, content, navigation }: TemplateData) {
  return (
    <html>
      <head>
        <title>{title}</title>
      </head>
      <body>
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
        <main dangerouslySetInnerHTML={{ __html: content }} />
      </body>
    </html>
  );
}
