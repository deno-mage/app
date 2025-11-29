/**
 * Server-side error overlay for development.
 *
 * Renders a full-page error display when page rendering fails.
 * This is used when the error occurs during SSR, before the page can load.
 *
 * @module
 */

import type { VNode } from "preact";
import { render } from "preact-render-to-string";

/**
 * Props for the error overlay component.
 */
export interface DevErrorOverlayProps {
  /** Error message */
  message: string;
  /** Error stack trace */
  stack?: string;
  /** File path where error occurred */
  filePath?: string;
}

/**
 * Error overlay component for server-side rendering errors.
 *
 * Displays a styled error page with the error message and stack trace.
 */
export function DevErrorOverlay(props: DevErrorOverlayProps): VNode {
  const { message, stack, filePath } = props;

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Build Error - Mage</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
            background: #1a1a1a;
            color: #e0e0e0;
            min-height: 100vh;
            padding: 2rem;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
          }
          .icon {
            width: 48px;
            height: 48px;
            background: #ff6b6b;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }
          h1 {
            color: #ff6b6b;
            font-size: 1.5rem;
            font-weight: 600;
          }
          .file-path {
            color: #888;
            font-size: 0.875rem;
            margin-bottom: 1rem;
          }
          .message {
            background: #2a2a2a;
            border: 1px solid #3a3a3a;
            border-left: 4px solid #ff6b6b;
            border-radius: 4px;
            padding: 1rem 1.5rem;
            margin-bottom: 1.5rem;
            font-size: 1rem;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
          }
          .stack {
            background: #2a2a2a;
            border: 1px solid #3a3a3a;
            border-radius: 4px;
            padding: 1rem 1.5rem;
            font-size: 0.875rem;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
            color: #888;
            overflow-x: auto;
          }
          .stack-title {
            color: #888;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 0.5rem;
          }
          .tip {
            margin-top: 2rem;
            padding: 1rem 1.5rem;
            background: #2a3a2a;
            border: 1px solid #3a4a3a;
            border-radius: 4px;
            color: #8bc34a;
            font-size: 0.875rem;
          }
          .tip-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
          }
        `,
          }}
        />
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">!</div>
            <h1>Build Error</h1>
          </div>

          {filePath && <div class="file-path">{filePath}</div>}

          <div class="message">{message}</div>

          {stack && (
            <div>
              <div class="stack-title">Stack Trace</div>
              <pre class="stack">{stack}</pre>
            </div>
          )}

          <div class="tip">
            <div class="tip-title">Fix the error and save</div>
            The page will automatically reload when the error is resolved.
          </div>
        </div>
      </body>
    </html>
  );
}

/**
 * Renders an error overlay to HTML.
 *
 * @param error The error to display
 * @param filePath Optional file path where error occurred
 * @returns Complete HTML document string
 */
export function renderErrorOverlay(error: Error, filePath?: string): string {
  const html = render(
    <DevErrorOverlay
      message={error.message}
      stack={error.stack}
      filePath={filePath}
    />,
  );

  return `<!DOCTYPE html>${html}`;
}
