import type { BuildOptions } from "./builder.ts";
import { build } from "./builder.ts";
import { resolve } from "@std/path";
import { logger } from "./logger.ts";
import { WATCHER_DEBOUNCE_MS } from "./constants.ts";

/**
 * WebSocket clients connected for hot reload.
 */
const hotReloadClients = new Set<WebSocket>();

/**
 * Register a WebSocket client for hot reload notifications.
 */
export function registerHotReloadClient(socket: WebSocket): void {
  hotReloadClients.add(socket);

  socket.onclose = () => {
    hotReloadClients.delete(socket);
  };

  socket.onerror = () => {
    hotReloadClients.delete(socket);
  };
}

/**
 * Notify all connected clients to reload.
 */
function notifyClients(): void {
  const message = "reload";

  for (const client of hotReloadClients) {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    } catch (error) {
      logger.error(
        error instanceof Error ? error : new Error(String(error)),
      );
      hotReloadClients.delete(client);
    }
  }

  logger.info(`Notified ${hotReloadClients.size} hot reload clients`);
}

/**
 * Watch articlesDir, layoutDir, and assetsDir for file changes and rebuild on change.
 *
 * Notifies connected WebSocket clients to reload.
 */
export async function watch(options: BuildOptions): Promise<void> {
  const { articlesDir, layoutDir, assetsDir = "assets" } = options;
  const absoluteArticlesDir = resolve(articlesDir);
  const absoluteLayoutDir = resolve(layoutDir);
  const absoluteAssetsDir = resolve(assetsDir);

  logger.info(`Watching ${absoluteArticlesDir} for changes...`);
  logger.info(`Watching ${absoluteLayoutDir} for changes...`);

  // Check if assets directory exists before watching
  const watchPaths = [absoluteArticlesDir, absoluteLayoutDir];
  try {
    const stat = await Deno.stat(absoluteAssetsDir);
    if (stat.isDirectory) {
      watchPaths.push(absoluteAssetsDir);
      logger.info(`Watching ${absoluteAssetsDir} for changes...`);
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }

  // Initial build
  await build(options);

  // Watch for changes in all directories
  const watcher = Deno.watchFs(watchPaths);

  // Debounce rapid changes and prevent concurrent builds
  let rebuildTimer: number | null = null;
  let isBuilding = false;
  let needsRebuild = false; // Flag to track if rebuild is needed after current build

  for await (const event of watcher) {
    // Handle modify events for .md, .tsx, .ts, or any asset files
    const isMarkdownChange = event.paths.some((path) => path.endsWith(".md"));
    const isLayoutChange = event.paths.some((path) =>
      path.endsWith(".tsx") || path.endsWith(".ts")
    );
    const isAssetChange = event.paths.some((path) =>
      path.startsWith(absoluteAssetsDir)
    );

    if (
      event.kind === "modify" &&
      (isMarkdownChange || isLayoutChange || isAssetChange)
    ) {
      // If currently building, mark that we need another rebuild after this one
      if (isBuilding) {
        needsRebuild = true;
        continue;
      }

      // Clear existing timer
      if (rebuildTimer !== null) {
        clearTimeout(rebuildTimer);
      }

      // Schedule rebuild
      rebuildTimer = setTimeout(async () => {
        // Build loop: keep building while there are pending changes
        do {
          needsRebuild = false;
          isBuilding = true;
          logger.info(`Detected changes, rebuilding...`);

          try {
            await build(options);
            notifyClients();
          } catch (error) {
            logger.error(
              error instanceof Error ? error : new Error(String(error)),
            );
          } finally {
            isBuilding = false;
            rebuildTimer = null;
          }

          // If changes came in during build, rebuild immediately
          if (needsRebuild) {
            logger.info("Additional changes detected, rebuilding again...");
          }
        } while (needsRebuild);
      }, WATCHER_DEBOUNCE_MS);
    }
  }
}
