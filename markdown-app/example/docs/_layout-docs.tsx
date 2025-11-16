import type { NavigationData } from "../../navigation.ts";

export interface LayoutProps {
  title: string;
  content: string;
  navigation: NavigationData;
  basePath: string;
}

export function Layout({ title, content, navigation }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
      </head>
      <body>
        <header>
          <h1>Example Docs</h1>
        </header>
        <aside>
          {navigation.aside && (
            <nav>
              {navigation.aside?.map((section) =>
                section.title
                  ? (
                    <section key={section.title}>
                      <h3>{section.title}</h3>
                      <ul>
                        {section.items.map((item) => (
                          <li key={item.slug}>
                            <a
                              href={item.href}
                              aria-current={item.isCurrent ? "page" : undefined}
                            >
                              {item.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )
                  : (
                    <ul key="no-section">
                      {section.items.map((item) => (
                        <li key={item.slug}>
                          <a
                            href={item.href}
                            aria-current={item.isCurrent ? "page" : undefined}
                          >
                            {item.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )
              )}
            </nav>
          )}
        </aside>
        <main>
          <article dangerouslySetInnerHTML={{ __html: content }} />
        </main>
      </body>
    </html>
  );
}
