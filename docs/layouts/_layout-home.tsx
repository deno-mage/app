import { Head, type LayoutProps } from "../../markdown-app/mod.ts";

export function Layout({ articleHtml, navigation, asset }: LayoutProps) {
  return (
    <>
      <Head>
        <link rel="icon" href={asset("favicon.svg")} />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
        />
      </Head>
      <header>
        <div className="container">
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
        </div>
      </header>
      <main>
        <div className="container">
          <article dangerouslySetInnerHTML={{ __html: articleHtml }} />
        </div>
      </main>
      <footer>
        <div className="container">
          <p>Built with Mage App</p>
        </div>
      </footer>
    </>
  );
}
