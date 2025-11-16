import type { TemplateData } from "../../../template.ts";

export function Layout(data: TemplateData) {
  const navItems = data.navigation.default || [];
  return (
    <html>
      <body>
        <nav>
          {navItems.length > 0 && <ul>{navItems.length} sections</ul>}
        </nav>
        <div dangerouslySetInnerHTML={{ __html: data.content }} />
      </body>
    </html>
  );
}
