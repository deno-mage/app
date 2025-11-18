/**
 * Public API for pages module.
 *
 * @module
 */

import type { MageApp } from "../app/mod.ts";
import { registerDevServer as registerDev } from "./dev-server.ts";
import { build as buildStatic } from "./build.ts";
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
 * @example Development server (no siteMetadata needed)
 * ```ts
 * import { MageApp } from "@mage/app";
 * import { pages } from "@mage/app/pages";
 *
 * const { registerDevServer } = pages();
 *
 * const app = new MageApp();
 * registerDevServer(app, { rootDir: "./docs" });
 *
 * Deno.serve({ port: 3000 }, app.handler);
 * ```
 *
 * @example Build (siteMetadata required for sitemap/robots.txt)
 * ```ts
 * import { pages } from "@mage/app/pages";
 *
 * const { build } = pages({
 *   siteMetadata: {
 *     baseUrl: "https://example.com",
 *     title: "My Site",
 *   },
 * });
 *
 * await build({ rootDir: "./docs" });
 * ```
 */
export function pages(options: PagesOptions = {}): {
  registerDevServer: (
    app: MageApp,
    devOptions?: DevServerOptions,
  ) => () => void;
  build: (buildOptions?: BuildOptions) => Promise<void>;
  registerStaticServer: (
    app: MageApp,
    staticOptions?: StaticServerOptions,
  ) => void;
} {
  const { siteMetadata } = options;

  return {
    /**
     * Registers development server with hot reload.
     *
     * Auto-watches files for changes, renders pages in-memory,
     * and triggers hot reload on changes.
     *
     * @param app Mage application instance
     * @param devOptions Dev server configuration
     * @returns Cleanup function to stop watchers
     */
    registerDevServer(
      app: MageApp,
      devOptions: DevServerOptions = {},
    ): () => void {
      return registerDev(app, devOptions);
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
      await buildStatic(siteMetadata, buildOptions);
    },

    /**
     * Registers static file server.
     *
     * Serves pre-built static files from dist directory.
     *
     * @param _app Mage application instance
     * @param _staticOptions Static server configuration
     */
    registerStaticServer(
      _app: MageApp,
      _staticOptions: StaticServerOptions = {},
    ): void {
      // TODO: Implement in Phase 5
      throw new Error("registerStaticServer not yet implemented");
    },
  };
}
