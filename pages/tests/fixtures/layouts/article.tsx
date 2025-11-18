import type { LayoutProps } from "../../../types.ts";

export default function ArticleLayout(props: LayoutProps) {
  const metaTag = props.description
    ? `<meta name="description" content="${props.description}" />`
    : "";

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <title>${props.title}</title>
  ${metaTag}
</head>
<body>
  <article>
    <h1>${props.title}</h1>
    <div>${props.html}</div>
  </article>
</body>
</html>`;

  return <div dangerouslySetInnerHTML={{ __html: fullHtml }} />;
}
