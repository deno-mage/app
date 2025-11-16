import type { TemplateData } from "../../../template.ts";

export function Layout(data: TemplateData) {
  return (
    <html>
      <head>
        <title>{data.title}</title>
      </head>
      <body>
        <main dangerouslySetInnerHTML={{ __html: data.content }} />
      </body>
    </html>
  );
}
