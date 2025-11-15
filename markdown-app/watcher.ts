import type { BuildOptions } from "./builder.ts";
import { build } from "./builder.ts";
import { resolve } from "@std/path";
import { MageLogger } from "../logs/mod.ts";

const logger = new MageLogger("Markdown App");

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
 * Watch sourceDir for markdown file changes and rebuild on change.
 *
 * Notifies connected WebSocket clients to reload.
 */
export async function watch(options: BuildOptions): Promise<void> {
  const { sourceDir } = options;
  const absoluteSourceDir = resolve(sourceDir);

  logger.info(`Watching ${absoluteSourceDir} for changes...`);

  // Initial build
  await build(options);

  // Watch for changes
  const watcher = Deno.watchFs(absoluteSourceDir);

  // Debounce rapid changes
  let rebuildTimer: number | null = null;
  const DEBOUNCE_MS = 100;

  for await (const event of watcher) {
    // Only handle modify events for .md files
    const isMarkdownChange = event.paths.some((path) => path.endsWith(".md"));

    if (event.kind === "modify" && isMarkdownChange) {
      // Clear existing timer
      if (rebuildTimer !== null) {
        clearTimeout(rebuildTimer);
      }

      // Schedule rebuild
      rebuildTimer = setTimeout(async () => {
        logger.info(`Detected changes, rebuilding...`);

        try {
          await build(options);
          notifyClients();
        } catch (error) {
          logger.error(
            error instanceof Error ? error : new Error(String(error)),
          );
        }

        rebuildTimer = null;
      }, DEBOUNCE_MS);
    }
  }
}
