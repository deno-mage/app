/**
 * Client bundle building with esbuild.
 *
 * Generates entry points for page hydration and bundles them with esbuild.
 * Supports both development (unminified, with sourcemaps) and production
 * (minified, hashed) modes.
 *
 * @module
 */

import * as esbuild from "esbuild";
import { crypto } from "@std/crypto/crypto";
import { encodeHex } from "@std/encoding/hex";
import { join } from "@std/path";

// Path to error-boundary.tsx in the pages module
const ERROR_BOUNDARY_PATH = join(
  new URL(".", import.meta.url).pathname,
  "error-boundary.tsx",
);

/**
 * Options for building a client bundle.
 */
export interface BundleBuildOptions {
  /** Path to the layout file to bundle */
  layoutPath: string;
  /** Root directory of the project */
  rootDir: string;
  /** Whether this is a production build */
  production?: boolean;
  /** Page-specific identifier for the bundle */
  pageId: string;
}

/**
 * Result of building a client bundle.
 */
export interface BundleResult {
  /** Bundled JavaScript code */
  code: string;
  /** Source map (development only) */
  map?: string;
  /** Hashed filename (production only) */
  filename?: string;
}

/**
 * Generates a hydration entry point for a page.
 *
 * The entry point imports the layout, extracts article HTML from the DOM,
 * merges with window.__PAGE_PROPS__, and hydrates the layout wrapped in
 * an error boundary for graceful degradation.
 *
 * @param layoutPath Absolute path to the layout file
 * @param _pageId Unique identifier for the page (currently unused)
 * @returns Entry point code as a string
 */
export function generateEntryPoint(
  layoutPath: string,
  _pageId: string,
): string {
  return `import { hydrate } from "preact";
import { ErrorBoundary } from "${ERROR_BOUNDARY_PATH}";
import LayoutComponent from "${layoutPath}";

// Wrapper that extracts only the body children from the Layout
// The Layout renders <><Head/><body>children</body></>, but we only want the body children
function BodyContent(props) {
  const layoutOutput = LayoutComponent(props);

  // Layout returns a Fragment with [Head, body]
  // Extract the body element
  const children = Array.isArray(layoutOutput.props?.children)
    ? layoutOutput.props.children
    : [layoutOutput.props?.children];

  const bodyElement = children.find(child => child?.type === 'body');

  // Return just the body's children (without the body wrapper)
  return bodyElement ? bodyElement.props.children : null;
}

// Extract layout content HTML from DOM before hydration
const appRoot = document.getElementById("app");
if (!appRoot) {
  console.error("[Mage Pages] Failed to find #app element - hydration aborted");
  // Page still works with SSR'd content, just no interactivity
} else {
  const layoutContainer = appRoot.querySelector('[data-mage-layout="true"]');

  const props = {
    ...window.__PAGE_PROPS__,
    html: layoutContainer ? layoutContainer.innerHTML : "",
  };

  try {
    // Hydrate only the body content (not the full Layout with <body> tag)
    hydrate(
      <ErrorBoundary>
        <BodyContent {...props} />
      </ErrorBoundary>,
      appRoot
    );
  } catch (error) {
    console.error("[Mage Pages] Hydration failed:", error);
    // Page remains functional with SSR'd HTML
  }
}
`;
}

/**
 * Builds a client bundle for a page.
 *
 * Generates an entry point, runs esbuild, and returns the bundled code.
 *
 * In development mode:
 * - No minification
 * - Inline source maps
 * - Returns code directly
 *
 * In production mode:
 * - Minified
 * - No source maps
 * - Content-hashed filename
 *
 * @param options Bundle build options
 * @returns Bundle result with code and optional metadata
 */
export async function buildBundle(
  options: BundleBuildOptions,
): Promise<BundleResult> {
  const { layoutPath, rootDir, production = false, pageId } = options;

  // Generate entry point
  const entryCode = generateEntryPoint(layoutPath, pageId);

  // Create a virtual entry point using esbuild's stdin
  const buildResult = await esbuild.build({
    stdin: {
      contents: entryCode,
      loader: "tsx",
      resolveDir: rootDir,
    },
    bundle: true,
    format: "esm",
    target: "es2020",
    minify: production,
    sourcemap: production ? false : "inline",
    jsxImportSource: "preact",
    jsx: "automatic",
    write: false,
    define: {
      "process.env.NODE_ENV": JSON.stringify(
        production ? "production" : "development",
      ),
    },
  });

  const code = buildResult.outputFiles[0].text;

  if (production) {
    // Generate content hash for filename
    const hashBytes = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(code),
    );
    const hash = encodeHex(hashBytes).slice(0, 8);
    const filename = `${pageId}-${hash}.js`;

    return { code, filename };
  }

  return { code };
}

/**
 * Stops the esbuild service.
 *
 * Should be called when done building bundles to release resources.
 */
export function stopBundleBuilder(): void {
  esbuild.stop();
}
