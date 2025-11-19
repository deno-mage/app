import type { JSX } from "preact";
import type { HtmlTemplateProps } from "../../types.ts";

export default function HtmlTemplate(
  { head, body, bundleUrl, props }: HtmlTemplateProps,
): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta dangerouslySetInnerHTML={{ __html: head }} />
      </head>
      <body>
        <div
          id="app"
          data-layout="true"
          dangerouslySetInnerHTML={{ __html: body }}
        />
        {bundleUrl && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `window.__PAGE_PROPS__ = ${JSON.stringify(props)};`,
              }}
            />
            <script type="module" src={bundleUrl} />
          </>
        )}
      </body>
    </html>
  );
}
