import type { JSX } from "preact";
import type { HtmlTemplateProps } from "../../pages-next/mod.ts";

export default function Html(props: HtmlTemplateProps): JSX.Element {
  return (
    <html lang="en" style="scroll-padding-top: 110px;">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Mage | {props.title}</title>
        <link rel="stylesheet" href="/public/styles.css" />
        <link rel="icon" href="/public/favicon.png" />
        {
          // Theme initialization script
        }
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              const stored = localStorage.getItem('theme');
              const system = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              const theme = stored || system;
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              }
            })();
          `,
          }}
        />
      </head>
      <body className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 fill-zinc-900 dark:fill-zinc-50">
        {props.children}
      </body>
    </html>
  );
}
