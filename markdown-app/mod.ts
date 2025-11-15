import type { MageApp } from "../app/app.ts";
import { build as buildImpl } from "./builder.ts";
import { watch as watchImpl } from "./watcher.ts";
import { register as registerImpl } from "./middleware.ts";

/**
 * Configuration options for markdown app.
 */
export interface MarkdownAppOptions {
  /**
   * Directory containing markdown source files.
   */
  sourceDir: string;

  /**
   * Directory where HTML files will be built.
   */
  outputDir: string;

  /**
   * Directory containing _layout-*.html template files.
   */
  layoutDir: string;

  /**
   * URL prefix for serving files and generating links.
   * @default "/"
   */
  basePath?: string;

  /**
   * Enable development mode (hot reload).
   * @default false
   */
  dev?: boolean;
}

/**
 * Markdown app API returned by factory function.
 */
export interface MarkdownApp {
  /**
   * Register serveFiles and hot reload WebSocket with MageApp.
   *
   * @param app MageApp instance
   */
  register: (app: MageApp) => void;

  /**
   * Watch sourceDir for changes and rebuild on change.
   * Notifies connected WebSocket clients to reload.
   *
   * Only useful in dev mode.
   */
  watch: () => Promise<void>;

  /**
   * Build all markdown files to static HTML once.
   * Useful for CI/deployment builds.
   */
  build: () => Promise<void>;
}

/**
 * Create a markdown app instance.
 */
export function markdownApp(options: MarkdownAppOptions): MarkdownApp {
  const {
    sourceDir,
    outputDir,
    layoutDir,
    basePath = "/",
    dev = false,
  } = options;

  // Validate required options
  if (!sourceDir) {
    throw new Error("markdownApp: sourceDir is required");
  }
  if (!outputDir) {
    throw new Error("markdownApp: outputDir is required");
  }
  if (!layoutDir) {
    throw new Error("markdownApp: layoutDir is required");
  }

  const buildOptions = {
    sourceDir,
    outputDir,
    layoutDir,
    basePath,
    dev,
  };

  return {
    register: (app: MageApp) => {
      registerImpl(app, {
        outputDir,
        basePath,
        dev,
      });
    },

    watch: async () => {
      await watchImpl(buildOptions);
    },

    build: async () => {
      await buildImpl(buildOptions);
    },
  };
}
