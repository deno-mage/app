import type { HtmlTemplateProps } from "../../types.ts";

export default function HtmlTemplate(
  { head, body, bundleUrl, props }: HtmlTemplateProps,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${head}
</head>
<body>
  <div id="app" data-layout="true">${body}</div>
  ${
    bundleUrl
      ? `
    <script>
      window.__PAGE_PROPS__ = ${JSON.stringify(props)};
    </script>
    <script type="module" src="${bundleUrl}"></script>
  `
      : ""
  }
</body>
</html>`;
}
