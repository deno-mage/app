import type { JSX } from "preact";
import type { HtmlTemplateProps } from "../pages/mod.ts";

export default function Html(props: HtmlTemplateProps): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Mage | {props.layoutProps.title}</title>
        <link rel="stylesheet" href="/public/styles.css" />
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
        {
          // Scroll to heading script
        }
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              if (window.location.hash) {
                // Wait for DOM to be ready
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', scrollToHash);
                } else {
                  scrollToHash();
                }
              }

              function scrollToHash() {
                const hash = window.location.hash.slice(1);
                if (!hash) return;

                const element = document.getElementById(hash);
                if (element) {
                  // Small delay to ensure layout is complete
                  setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 0);
                }
              }

              // Handle hash changes (e.g., clicking anchor links)
              window.addEventListener('hashchange', scrollToHash);
            })();
          `,
          }}
        />
      </head>
      <body className="bg-zinc-50 dark:bg-zinc-900"></body>
    </html>
  );
}
