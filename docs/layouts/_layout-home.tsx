import type { NavigationData } from "../../markdown-app/mod.ts";

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
          <nav>
            {navigation.header && (
              <ul>
                {navigation.header.map((section) =>
                  section.items.map((item) => (
                    <li key={item.slug}>
                      <a
                        href={item.href}
                        aria-current={item.isCurrent ? "page" : undefined}
                      >
                        {item.title}
                      </a>
                    </li>
                  ))
                )}
              </ul>
            )}
          </nav>
        </header>
        <main>
          <article dangerouslySetInnerHTML={{ __html: content }} />
        </main>
        <footer>
          <p>Built with Mage App</p>
        </footer>
      </body>
    </html>
  );
}
