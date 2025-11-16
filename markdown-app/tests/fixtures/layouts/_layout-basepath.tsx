import type { TemplateData } from "../../../template.ts";

export function Layout(data: TemplateData) {
  return (
    <html>
      <body>
        <a href={`${data.basePath}/home`}>Home</a>
      </body>
    </html>
  );
}
