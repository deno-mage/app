export interface HeadProps {
  title: string;
  description?: string;
}

/**
 * Renders the HTML head element with meta tags, title, and theme initialization.
 *
 * Includes an inline script that sets the theme before first paint to prevent
 * flash of incorrect theme. Priority: localStorage → system preference → light.
 */
export const Head = (props: HeadProps) => {
  return (
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{props.title}</title>
      {props.description && (
        <meta name="description" content={props.description} />
      )}
      <link rel="stylesheet" href="/public/styles.css" />
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
    </head>
  );
};
