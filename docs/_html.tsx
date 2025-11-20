import type { JSX } from "preact";
import type { HtmlTemplateProps } from "../pages/mod.ts";

export default function Html(props: HtmlTemplateProps): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Mage Docs | {props.layoutProps.title}</title>
      </head>
      <body className="bg-green-900"></body>
    </html>
  );
}
