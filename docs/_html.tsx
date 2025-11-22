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
              document.documentElement.setAttribute('data-theme', stored || system);
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
      <body></body>
    </html>
  );
}
