import { render } from "preact-render-to-string";
import type { TemplateData } from "./template.ts";

/**
 * Render a JSX layout to static HTML.
 *
 * Dynamically imports the layout module and renders it using Preact.
 */
export async function renderJsxLayout(
  layoutPath: string,
  data: TemplateData,
): Promise<string> {
  // Dynamic import the layout module (use file:// URL for absolute path)
  const layoutUrl = layoutPath.startsWith("file://")
    ? layoutPath
    : `file://${layoutPath}`;
  const layoutModule = await import(layoutUrl);

  if (!layoutModule.Layout) {
    throw new Error(
      `Layout module ${layoutPath} must export a "Layout" component`,
    );
  }

  // Render the Layout component to static HTML
  const html = render(layoutModule.Layout(data));

  // Add DOCTYPE (Preact doesn't include it)
  return `<!DOCTYPE html>\n${html}`;
}
