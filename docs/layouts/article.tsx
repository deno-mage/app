import type { LayoutProps } from "../../pages/mod.ts";
import { Head } from "../components/head.tsx";
import { ColorMode } from "../components/color-mode.tsx";

export default function DefaultLayout(props: LayoutProps) {
  return (
    <html lang="en">
      <Head title={props.title} description={props.description} />
      <body>
        <header>
          <div>
            <nav>
              <a href="/">Home</a>
              {" | "}
              <a href="/installation">Installation</a>
              {" | "}
              <a href="/getting-started">Getting Started</a>
            </nav>
            <ColorMode />
          </div>
        </header>
        <main dangerouslySetInnerHTML={{ __html: props.html }} />
        <footer>
          <div>
            <p>Mage - Simple, Fast Web Framework for Deno</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
