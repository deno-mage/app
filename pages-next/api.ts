/**
 * Public API for pages-next module.
 *
 * @module
 */

import type { MageApp } from "../app/mod.ts";
import { build as buildStatic } from "./build.ts";
import { registerStaticServer as registerStatic } from "./static-server.ts";
import type {
  BuildOptions,
  DevServerOptions,
  PagesOptions,
  StaticServerOptions,
} from "./types.ts";

/**
 * Factory function for pages module.
 *
 * Returns functions for dev server, static build, and static serving.
 *
 * For development, no siteMetadata is required. For building, siteMetadata
 * is required for sitemap and robots.txt generation.
 */
export function pages(options: PagesOptions = {}): {
  registerDevServer: (
    app: MageApp,
    devOptions?: DevServerOptions,
  ) => Promise<() => void>;
  build: (buildOptions?: BuildOptions) => Promise<void>;
  registerStaticServer: (
    app: MageApp,
    staticOptions?: StaticServerOptions,
  ) => void;
} {
  const { siteMetadata, markdownOptions } = options;

  return {
    /**
     * Registers development server with hot reload.
     *
     * Auto-watches files for changes, renders pages in-memory,
     * and triggers hot reload on changes.
     *
     * @param _app Mage application instance
     * @param _devOptions Dev server configuration
     * @returns Promise resolving to cleanup function to stop watchers
     */
    registerDevServer(
      _app: MageApp,
      _devOptions: DevServerOptions = {},
    ): Promise<() => void> {
      // TODO: Implement in Phase 8
      throw new Error("Dev server not yet implemented (Phase 8)");
    },

    /**
     * Builds static site files.
     *
     * Renders all pages to static HTML, copies and hashes assets,
     * generates sitemap and robots.txt.
     *
     * Requires siteMetadata to be provided in pages() options.
     *
     * @param buildOptions Build configuration
     * @throws Error if siteMetadata not provided
     */
    async build(buildOptions: BuildOptions = {}): Promise<void> {
      if (!siteMetadata) {
        throw new Error(
          "siteMetadata is required for build(). Provide it in pages() options.",
        );
      }
      await buildStatic(siteMetadata, {
        ...buildOptions,
        markdownOptions: buildOptions.markdownOptions ?? markdownOptions,
      });
    },

    /**
     * Registers static file server.
     *
     * Serves pre-built static files from dist directory.
     *
     * @param app Mage application instance
     * @param staticOptions Static server configuration
     */
    registerStaticServer(
      app: MageApp,
      staticOptions: StaticServerOptions = {},
    ): void {
      registerStatic(app, staticOptions);
    },
  };
}
