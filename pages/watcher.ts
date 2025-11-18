/**
 * File watching utilities for development mode.
 *
 * @module
 */

/**
 * Callback invoked when watched files change.
 */
export type WatchCallback = (
  path: string,
  kind: Deno.FsEvent["kind"],
) => void | Promise<void>;

/**
 * Watches a directory for file changes.
 *
 * Invokes callback on create, modify, or remove events.
 * Silently ignores missing directories or permission errors.
 *
 * @returns AbortController to stop watching
 */
export function watchDirectory(
  dirPath: string,
  callback: WatchCallback,
): AbortController {
  const abortController = new AbortController();
  let watcher: Deno.FsWatcher | null = null;

  // Set up abort handler to close watcher
  abortController.signal.addEventListener("abort", () => {
    if (watcher) {
      watcher.close();
    }
  });

  (async () => {
    try {
      watcher = Deno.watchFs(dirPath, {
        recursive: true,
      });

      for await (const event of watcher) {
        // Ignore access events, only handle modifications
        if (
          event.kind === "create" ||
          event.kind === "modify" ||
          event.kind === "remove"
        ) {
          for (const path of event.paths) {
            await callback(path, event.kind);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or access denied - silently ignore
      if (
        error instanceof Deno.errors.NotFound ||
        error instanceof Deno.errors.PermissionDenied
      ) {
        return;
      }
      // Ignore interrupted errors from watcher.close()
      if (error instanceof Error && error.message.includes("Interrupted")) {
        return;
      }
      throw error;
    }
  })();

  return abortController;
}

/**
 * Watches multiple directories simultaneously.
 *
 * @returns Array of AbortControllers (one per directory)
 */
export function watchDirectories(
  dirPaths: string[],
  callback: WatchCallback,
): AbortController[] {
  return dirPaths.map((dirPath) => watchDirectory(dirPath, callback));
}

/**
 * Stops all watchers.
 */
export function stopWatching(controllers: AbortController[]): void {
  for (const controller of controllers) {
    controller.abort();
  }
}
