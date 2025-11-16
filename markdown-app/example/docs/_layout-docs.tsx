import type { LayoutProps } from "../../mod.ts";

export function Layout({ articleHtml, navigation }: LayoutProps) {
  return (
    <>
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
        <article dangerouslySetInnerHTML={{ __html: articleHtml }} />
      </main>
    </>
  );
}
