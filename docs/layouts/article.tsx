import type { LayoutProps } from "../../pages/mod.ts";

const cacheBuster = Date.now();

const { Head, ColorMode } = (await import(
  `../components/index.ts?t=${cacheBuster}`
)) as typeof import("../components/index.ts");

export default function ArticleLayout(props: LayoutProps) {
  return (
    <html lang="en">
      <Head title={props.title} description={props.description} />
      <body>
        <header>
          <div className="container">
            <nav>
              <ul>
                <li>
                  <a href="/" className="nav-hero">
                    🧙‍♂️ Mage
                  </a>
                </li>
              </ul>
              <ul>
                <li>
                  <a href="/">Docs</a>
                </li>
                <li>
                  <a href="https://github.com/deno-mage/app">GitHub</a>
                </li>
                <li>
                  <a href="https://jsr.io/@mage/app">JSR</a>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main
          className="container"
          dangerouslySetInnerHTML={{ __html: props.html }}
        />
        <hr />
        <footer>
          <div className="container flex justify-between align-top">
            <p>Mage - Simple, Fast Web Framework for Deno</p>
            <ColorMode />
          </div>
        </footer>
      </body>
    </html>
  );
}
