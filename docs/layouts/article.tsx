import type { LayoutProps } from "../../pages/mod.ts";
import { Head } from "../components/head.tsx";
import { ColorMode } from "../components/color-mode.tsx";

export default function ArticleLayout(props: LayoutProps) {
  return (
    <>
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
          data-mage-layout="true"
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
    </>
  );
}
