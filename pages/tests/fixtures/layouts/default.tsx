import type { LayoutProps } from "../../../types.ts";

export default function DefaultLayout(props: LayoutProps) {
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <title>${props.title}</title>
</head>
<body>
  <div>${props.html}</div>
</body>
</html>`;

  return <div dangerouslySetInnerHTML={{ __html: fullHtml }} />;
}
