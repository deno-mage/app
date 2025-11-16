import type { MageApp } from "../app/app.ts";
import { serveFiles } from "../serve-files/middleware.ts";
import { registerHotReloadClient } from "./watcher.ts";
import { resolve } from "@std/path";
import { logger } from "./logger.ts";
import { HOT_RELOAD_ENDPOINT } from "./constants.ts";

/**
 * Options for registering markdown app middleware.
 */
export interface RegisterOptions {
  outputDir: string;
  basePath: string;
  dev: boolean;
}

/**
 * Register markdown app middleware with a MageApp instance.
 *
 * Sets up serveFiles for outputDir and hot reload WebSocket (dev mode only).
 */
export function register(app: MageApp, options: RegisterOptions): void {
  const { outputDir, basePath, dev } = options;
  const absoluteOutputDir = resolve(outputDir);

  // Normalize basePath (ensure leading slash, no trailing slash)
  const normalizedBasePath = basePath === "/"
    ? ""
    : basePath.replace(/\/$/, "");

  // Register serveFiles for static HTML
  const servePath = normalizedBasePath === ""
    ? "/*"
    : `${normalizedBasePath}/*`;

  app.get(
    servePath,
    serveFiles({
      directory: absoluteOutputDir,
      serveIndex: true,
    }),
  );

  logger.info(`Serving ${absoluteOutputDir} at ${servePath}`);

  // Register hot reload WebSocket (routes are auto-sorted by specificity)
  if (dev) {
    app.get(HOT_RELOAD_ENDPOINT, (c) => {
      c.webSocket((socket) => {
        registerHotReloadClient(socket);
      });
    });

    logger.info(`Hot reload enabled at ${HOT_RELOAD_ENDPOINT}`);
  }
}
