import { Head as PagesHead } from "../../pages/client.ts";
export interface HeadProps {
  title: string;
  description?: string;
}

/**
 * Renders the HTML head element with meta tags, title, and scripts.
 *
 * Includes inline scripts for:
 * - Theme initialization before first paint (localStorage → system preference → light)
 * - Scroll-to-heading based on URL hash with smooth scrolling
 */
export const Head = (props: HeadProps) => {
  return (
    <PagesHead>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{props.title}</title>
      {props.description && (
        <meta name="description" content={props.description} />
      )}
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
    </PagesHead>
  );
};
