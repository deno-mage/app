import type { LayoutProps } from "../../../types.ts";

export default function DefaultLayout(props: LayoutProps) {
  const metaTag = props.description
    ? `<meta name="description" content="${props.description}" />`
    : "";

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <title>${props.title}</title>
  ${metaTag}
  <link rel="stylesheet" href="/public/styles.css">
</head>
<body>
  <div>${props.html}</div>
</body>
</html>`;

  return <div dangerouslySetInnerHTML={{ __html: fullHtml }} />;
}
