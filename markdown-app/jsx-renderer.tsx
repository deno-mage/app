import { render } from "preact-render-to-string";
import type { LayoutProps } from "./template.ts";

export interface RenderOptions {
  dev?: boolean;
  themeColor?: string;
}

/**
 * Renders a JSX layout to static HTML with auto-injected head content.
 *
 * Dynamically imports and renders the layout, extracts Head components,
 * and assembles the final document with GitHub CSS, title, description,
 * and optional hot reload script.
 */
export async function renderJsxLayout(
  layoutPath: string,
  data: LayoutProps,
  options: RenderOptions = {},
): Promise<string> {
  const layoutUrl = layoutPath.startsWith("file://")
    ? layoutPath
    : `file://${layoutPath}`;
  const layoutModule = await import(layoutUrl);

  if (!layoutModule.Layout) {
    throw new Error(
      `Layout module ${layoutPath} must export a "Layout" component`,
    );
  }

  const rendered = render(layoutModule.Layout(data));
  const { customHeadContent, bodyContent } = extractHeadAndBody(rendered);

  // Build complete HTML document
  const html = buildDocument({
    title: data.title,
    description: data.description,
    themeColor: options.themeColor,
    customHeadContent,
    bodyContent,
    dev: options.dev,
  });

  return "<!DOCTYPE html>\n" + html;
}

/**
 * Extracts custom head content from Head components in rendered layout.
 */
function extractHeadAndBody(html: string): {
  customHeadContent: string;
  bodyContent: string;
} {
  const headRegex = /<head>([\s\S]*?)<\/head>/g;
  const headMatches: string[] = [];
  let match;

  while ((match = headRegex.exec(html)) !== null) {
    headMatches.push(match[1]);
  }

  return {
    customHeadContent: headMatches.join("\n"),
    bodyContent: html.replace(/<head>[\s\S]*?<\/head>/g, ""),
  };
}

interface BuildDocumentOptions {
  title: string;
  description?: string;
  themeColor?: string;
  customHeadContent: string;
  bodyContent: string;
  dev?: boolean;
}

/**
 * Builds complete HTML document with auto-injected head content.
 */
function buildDocument({
  title,
  description,
  themeColor,
  customHeadContent,
  bodyContent,
  dev,
}: BuildDocumentOptions): string {
  const descriptionMeta = description
    ? `<meta name="description" content="${description}" />`
    : "";
  const themeColorMeta = themeColor
    ? `<meta name="theme-color" content="${themeColor}" />`
    : "";
  const hotReloadScript = dev ? HOT_RELOAD_SCRIPT : "";

  return `<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="stylesheet" href="/gfm.css" />
<title>${title}</title>
${descriptionMeta}
${themeColorMeta}
${customHeadContent}
</head>
<body>
${bodyContent}
${hotReloadScript}
</body>
</html>`;
}

const HOT_RELOAD_SCRIPT = `<script>
  (function() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(protocol + '//' + host + '/__hot-reload');

    ws.onmessage = function() {
      console.log('[HMR] Reloading...');
      window.location.reload();
    };

    ws.onclose = function() {
      console.log('[HMR] Disconnected, retrying in 1s...');
      setTimeout(function() {
        window.location.reload();
      }, 1000);
    };

    ws.onerror = function() {
      console.log('[HMR] Connection error');
    };
  })();
</script>`;
