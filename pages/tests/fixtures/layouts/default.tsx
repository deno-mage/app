import type { LayoutProps } from "../../../types.ts";

export default function DefaultLayout(props: LayoutProps) {
  return (
    <html>
      <head>
        <title>{props.title}</title>
      </head>
      <body>
        <div dangerouslySetInnerHTML={{ __html: props.html }} />
      </body>
    </html>
  );
}
