/**
 * HTML document template loading and rendering.
 *
 * Loads _html.tsx from project root and uses it to wrap layout content
 * in a complete HTML document structure.
 *
 * @module
 */

import { join } from "@std/path";
import type { HtmlTemplate, HtmlTemplateProps } from "./types.ts";

/**
 * Default HTML template used when _html.tsx is not found.
 *
 * Provides a sensible default document structure for backward compatibility.
 */
function defaultHtmlTemplate(props: HtmlTemplateProps): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${props.head}
</head>
<body>
  <div id="app" data-layout="true">${props.body}</div>
  ${
    props.bundleUrl
      ? `
    <script>
      window.__PAGE_PROPS__ = ${JSON.stringify(props.props)};
    </script>
    <script type="module" src="${props.bundleUrl}"></script>
  `
      : ""
  }
</body>
</html>`;
}

/**
 * Loads the HTML template from _html.tsx in the project root.
 *
 * If _html.tsx exists, validates it exports a default function.
 * If not found, returns the default template.
 *
 * @param rootDir Root directory to search for _html.tsx
 * @returns Template function
 * @throws Error if _html.tsx exists but doesn't export a default function
 */
export async function loadHtmlTemplate(
  rootDir: string,
): Promise<HtmlTemplate> {
  const templatePath = join(rootDir, "_html.tsx");

  try {
    // Check if file exists
    await Deno.stat(templatePath);

    // Load the template module
    const templateModule = await import(`file://${templatePath}`);

    // Validate default export exists and is a function
    if (typeof templateModule.default !== "function") {
      throw new Error(
        `_html.tsx must export a default function, got ${typeof templateModule
          .default}`,
      );
    }

    return templateModule.default as HtmlTemplate;
  } catch (error) {
    // If file doesn't exist, use default template
    if (error instanceof Deno.errors.NotFound) {
      return defaultHtmlTemplate;
    }

    // Re-throw other errors (like validation errors)
    throw error;
  }
}

/**
 * Renders HTML using the template function.
 *
 * @param template Template function to use
 * @param props Props to pass to template
 * @returns Complete HTML document string
 */
export function renderWithTemplate(
  template: HtmlTemplate,
  props: HtmlTemplateProps,
): string {
  return template(props);
}
