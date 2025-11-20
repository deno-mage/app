import type { JSX } from "preact";

/**
 * Custom HTML template for tests.
 *
 * Head content, app wrapper, and scripts are injected automatically.
 * This template just defines the basic structure.
 */
export default function HtmlTemplate(): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{/* Content injected automatically */}</body>
    </html>
  );
}
