/**
 * HTML document template loading and rendering.
 *
 * Loads _html.tsx from project root and uses it to wrap layout content
 * in a complete HTML document structure.
 *
 * @module
 */

import { join } from "@std/path";
import { render } from "preact-render-to-string";
import type { JSX } from "preact";
import type { HtmlTemplate, HtmlTemplateProps } from "./types.ts";

/**
 * Default HTML template used when _html.tsx is not found.
 *
 * Provides a sensible default document structure for backward compatibility.
 */
function defaultHtmlTemplate(props: HtmlTemplateProps): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          dangerouslySetInnerHTML={{ __html: props.head }}
        />
      </head>
      <body>
        <div
          id="app"
          data-layout="true"
          dangerouslySetInnerHTML={{ __html: props.body }}
        />
        {props.bundleUrl && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html:
                  `window.__PAGE_PROPS__ = ${JSON.stringify(props.props)};`,
              }}
            />
            <script type="module" src={props.bundleUrl} />
          </>
        )}
      </body>
    </html>
  );
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
 * Renders HTML using the template component.
 *
 * @param template Template component to use
 * @param props Props to pass to template
 * @returns Complete HTML document string with DOCTYPE
 */
export function renderWithTemplate(
  template: HtmlTemplate,
  props: HtmlTemplateProps,
): string {
  const jsx = template(props);
  return `<!DOCTYPE html>\n${render(jsx)}`;
}
