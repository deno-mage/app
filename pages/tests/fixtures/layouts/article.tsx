import type { LayoutProps } from "../../../types.ts";

export default function ArticleLayout(props: LayoutProps) {
  return (
    <html>
      <head>
        <title>{props.title}</title>
        {props.description && (
          <meta name="description" content={props.description} />
        )}
      </head>
      <body>
        <article>
          <h1>{props.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: props.html }} />
        </article>
      </body>
    </html>
  );
}
