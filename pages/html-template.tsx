/**
 * HTML document template loading and rendering.
 *
 * Loads _html.tsx from project root and uses it to wrap layout content
 * in a complete HTML document structure.
 *
 * Head content, app wrapper, props script, and bundle script are injected
 * automatically after template rendering.
 *
 * @module
 */

import { join, toFileUrl } from "@std/path";
import { render } from "preact-render-to-string";
import type { JSX } from "preact";
import type { HtmlTemplate, HtmlTemplateProps, LayoutProps } from "./types.ts";

/**
 * Default fallback HTML template when _html.tsx is not found.
 *
 * Provides a minimal document structure with basic meta tags.
 * Head content, app wrapper, and scripts are injected automatically
 * by `injectContent()`.
 *
 * @returns Minimal HTML document structure
 */
function defaultHtmlTemplate(): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body></body>
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
export async function loadHtmlTemplate(rootDir: string): Promise<HtmlTemplate> {
  const templatePath = join(rootDir, "_html.tsx");

  try {
    // Convert to absolute file URL for dynamic import
    const absolutePath = toFileUrl(Deno.realPathSync(templatePath)).href;
    // Add cache-busting query parameter to force reload on every import
    const cacheBustedUrl = `${absolutePath}?t=${Date.now()}`;

    // Load the template module
    const templateModule = await import(cacheBustedUrl);

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
 * Injects head content, app wrapper, and scripts into rendered HTML.
 *
 * Automatically injects:
 * - Head content (from layouts) before `</head>`
 * - App wrapper div before `</body>`
 * - Props script before `</body>`
 * - Bundle script before `</body>`
 *
 * Note: The html field is removed from props before serialization since
 * it's extracted from the DOM on the client side during hydration.
 *
 * @param html Rendered HTML from template
 * @param headContent Extracted head content from layouts
 * @param bodyContent Extracted body content from layouts
 * @param bundleUrl URL to client bundle
 * @param props Page props for serialization (html field removed before injection)
 * @returns HTML with injected content
 */
function injectContent(
  html: string,
  headContent: string,
  bodyContent: string,
  bundleUrl: string,
  props: LayoutProps,
): string {
  // Inject head content before </head>
  let result = html.replace("</head>", `${headContent}\n</head>`);

  // Build injection content for body
  const appHtml = `<div id="app" data-mage-layout="true">${bodyContent}</div>`;

  // Remove html field from props (it's extracted from DOM on client)
  const { html: _html, ...propsWithoutHtml } = props;
  const propsScript = `<script>window.__PAGE_PROPS__ = ${
    JSON.stringify(
      propsWithoutHtml,
    )
  };</script>`;
  const bundleScript = `<script type="module" src="${bundleUrl}"></script>`;

  // Inject app + scripts before </body>
  result = result.replace(
    "</body>",
    `${appHtml}\n${propsScript}\n${bundleScript}\n</body>`,
  );

  return result;
}

/**
 * Renders HTML using the template component and injects content.
 *
 * @param template Template component to use
 * @param templateProps Props to pass to template
 * @param headContent Extracted head content from layouts
 * @param bodyContent Extracted body content from layouts
 * @param bundleUrl URL to client bundle
 * @returns Complete HTML document string with DOCTYPE and injected content
 */
export function renderWithTemplate(
  template: HtmlTemplate,
  templateProps: HtmlTemplateProps,
  headContent: string,
  bodyContent: string,
  bundleUrl: string,
): string {
  // Render template
  const jsx = template(templateProps);
  const baseHtml = render(jsx);

  // Inject head content, app, and scripts
  const finalHtml = injectContent(
    baseHtml,
    headContent,
    bodyContent,
    bundleUrl,
    templateProps.layoutProps,
  );

  return `<!DOCTYPE html>\n${finalHtml}`;
}
