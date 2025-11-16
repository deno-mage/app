import { Head, type LayoutProps } from "../../markdown-app/mod.ts";

export function Layout({ articleHtml, navigation }: LayoutProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
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
        <article dangerouslySetInnerHTML={{ __html: articleHtml }} />
      </main>
      <footer>
        <p>Built with Mage App</p>
      </footer>
    </>
  );
}
