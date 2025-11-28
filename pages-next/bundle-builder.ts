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
import { encodeHex } from "@std/encoding/hex";
import { join } from "@std/path";

const ERROR_BOUNDARY_PATH = join(
  new URL(".", import.meta.url).pathname,
  "error-boundary.tsx",
);

const CONTEXT_PATH = join(
  new URL(".", import.meta.url).pathname,
  "context.tsx",
);

/**
 * Options for building a client bundle.
 */
export interface BundleBuildOptions {
  /** Absolute path to the page file (.tsx only - markdown pages don't hydrate) */
  pagePath: string;
  /** Paths to layout files, ordered root to leaf */
  layoutPaths: string[];
  /** Root directory of the project for import resolution */
  rootDir: string;
  /** Whether this is a production build */
  production?: boolean;
  /** Page identifier for the bundle filename */
  pageId: string;
}

/**
 * Result of building a client bundle.
 */
export interface BundleResult {
  /** Bundled JavaScript code */
  code: string;
  /** Hashed filename (production only) */
  filename?: string;
}

/**
 * Generates a hydration entry point for a TSX page.
 *
 * The entry point:
 * 1. Imports the page and all layouts
 * 2. Extracts markdown content from DOM (for markdown pages wrapped in TSX layouts)
 * 3. Composes layouts around the page
 * 4. Hydrates with frontmatter from window.__PAGE_PROPS__
 *
 * @param pagePath Absolute path to the page file
 * @param layoutPaths Layout paths ordered root to leaf
 * @returns Entry point code as a string
 */
export function generateEntryPoint(
  pagePath: string,
  layoutPaths: string[],
): string {
  const layoutImports = layoutPaths
    .map((path, i) => `import Layout${i} from "${path}";`)
    .join("\n");

  // Build nested layout composition: Layout0 > Layout1 > ... > Page
  // Outermost layout (index 0) wraps everything
  const composeLayouts = (innerContent: string, index: number): string => {
    if (index >= layoutPaths.length) {
      return innerContent;
    }
    const deeper = composeLayouts(innerContent, index + 1);
    return `<Layout${index}>{${deeper}}</Layout${index}>`;
  };

  const composedTree = layoutPaths.length > 0
    ? composeLayouts("<PageComponent />", 0)
    : "<PageComponent />";

  return `import { hydrate } from "preact";
import { ErrorBoundary } from "${ERROR_BOUNDARY_PATH}";
import { FrontmatterProvider } from "${CONTEXT_PATH}";
import PageComponent from "${pagePath}";
${layoutImports}

const appRoot = document.getElementById("app");
if (!appRoot) {
  console.error("[Mage] Failed to find #app element - hydration aborted");
} else {
  const frontmatter = window.__PAGE_PROPS__?.frontmatter ?? {};

  try {
    hydrate(
      <ErrorBoundary>
        <FrontmatterProvider value={frontmatter}>
          ${composedTree}
        </FrontmatterProvider>
      </ErrorBoundary>,
      appRoot
    );
  } catch (error) {
    console.error("[Mage] Hydration failed:", error);
  }
}
`;
}

/**
 * Builds a client bundle for a page.
 *
 * In development mode:
 * - No minification
 * - Inline source maps
 *
 * In production mode:
 * - Minified
 * - Content-hashed filename
 *
 * @param options Bundle build options
 * @returns Bundle result with code and optional filename
 * @throws Error if esbuild fails
 */
export async function buildBundle(
  options: BundleBuildOptions,
): Promise<BundleResult> {
  const { pagePath, layoutPaths, rootDir, production = false, pageId } =
    options;

  const entryCode = generateEntryPoint(pagePath, layoutPaths);

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
    const hashBytes = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(code),
    );
    const hash = encodeHex(new Uint8Array(hashBytes)).slice(0, 8);
    const filename = `${pageId}-${hash}.js`;

    return { code, filename };
  }

  return { code };
}

/**
 * Stops the esbuild service and releases resources.
 *
 * Call this after all bundles are built to prevent resource leaks.
 */
export function stopBundleBuilder(): void {
  esbuild.stop();
}
