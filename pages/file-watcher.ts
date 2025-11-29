/**
 * File watcher for development server.
 *
 * Watches pages/, public/, and uno.config.ts for changes
 * and notifies subscribers with debouncing.
 *
 * @module
 */

import { debounce } from "@std/async/debounce";
import { relative, resolve } from "@std/path";

/**
 * Types of files that can change.
 */
export type FileChangeType = "page" | "layout" | "public" | "config" | "system";

/**
 * Information about a file change.
 */
export interface FileChange {
  /** Absolute path to the changed file */
  path: string;
  /** Relative path from watch root */
  relativePath: string;
  /** Type of file that changed */
  type: FileChangeType;
  /** Kind of filesystem event */
  kind: "create" | "modify" | "remove";
}

/**
 * Callback for file change notifications.
 */
export type FileChangeCallback = (changes: FileChange[]) => void;

/**
 * Options for creating a file watcher.
 */
export interface FileWatcherOptions {
  /** Root directory containing pages/, public/ */
  rootDir: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Callback when files change */
  onChange: FileChangeCallback;
}

/**
 * Classifies a file path into a change type.
 *
 * @param relativePath Path relative to root directory
 * @returns File change type
 */
export function classifyChange(relativePath: string): FileChangeType {
  // UnoCSS config
  if (relativePath === "uno.config.ts") {
    return "config";
  }

  // Public assets
  if (relativePath.startsWith("public/")) {
    return "public";
  }

  // Pages directory
  if (relativePath.startsWith("pages/")) {
    const fileName = relativePath.split("/").pop() ?? "";

    // System files
    if (fileName === "_html.tsx") {
      return "system";
    }
    if (fileName === "_error.tsx") {
      return "system";
    }
    if (fileName === "_not-found.tsx") {
      return "system";
    }

    // Layout files
    if (fileName === "_layout.tsx") {
      return "layout";
    }

    // Regular pages
    if (fileName.endsWith(".tsx") || fileName.endsWith(".md")) {
      return "page";
    }
  }

  // Default to config for unknown files in root
  return "config";
}

/**
 * Converts Deno.FsEvent.kind to our simplified kind.
 */
function normalizeEventKind(
  kind: Deno.FsEvent["kind"],
): FileChange["kind"] | null {
  switch (kind) {
    case "create":
      return "create";
    case "modify":
      return "modify";
    case "remove":
      return "remove";
    default:
      // Ignore "access", "any", "other"
      return null;
  }
}

/**
 * Creates a file watcher for the development server.
 *
 * Watches:
 * - pages/ directory for page and layout changes
 * - public/ directory for asset changes
 * - uno.config.ts for UnoCSS config changes
 *
 * Changes are debounced and batched before notification.
 *
 * @param options Watcher configuration
 * @returns Cleanup function to stop watching
 */
export function createFileWatcher(options: FileWatcherOptions): () => void {
  const { rootDir, debounceMs = 100, onChange } = options;

  const resolvedRoot = resolve(rootDir);
  const pagesDir = resolve(resolvedRoot, "pages");
  const publicDir = resolve(resolvedRoot, "public");
  const unoConfig = resolve(resolvedRoot, "uno.config.ts");

  // Collect changes for batching
  const pendingChanges = new Map<string, FileChange>();

  // Debounced flush function
  const flushChanges = debounce(() => {
    if (pendingChanges.size === 0) {
      return;
    }

    const changes = Array.from(pendingChanges.values());
    pendingChanges.clear();
    onChange(changes);
  }, debounceMs);

  // Track if watcher is running
  let isRunning = true;

  // Track watcher instances for cleanup
  const watchers: Deno.FsWatcher[] = [];

  // Watch directories
  const watchPaths = [pagesDir, publicDir, unoConfig];

  // Start watchers for each path
  for (const watchPath of watchPaths) {
    (async () => {
      try {
        const watcher = Deno.watchFs(watchPath, { recursive: true });
        watchers.push(watcher);

        for await (const event of watcher) {
          if (!isRunning) {
            break;
          }

          const kind = normalizeEventKind(event.kind);
          if (!kind) {
            continue;
          }

          for (const path of event.paths) {
            const relativePath = relative(resolvedRoot, path);

            // Skip hidden files and directories
            if (relativePath.split("/").some((part) => part.startsWith("."))) {
              continue;
            }

            const type = classifyChange(relativePath);

            pendingChanges.set(path, {
              path,
              relativePath,
              type,
              kind,
            });
          }

          flushChanges();
        }
      } catch (error) {
        // Ignore NotFound errors (directory doesn't exist yet)
        if (!(error instanceof Deno.errors.NotFound)) {
          throw error;
        }
      }
    })();
  }

  // Cleanup function
  return () => {
    isRunning = false;
    flushChanges.clear();

    // Close all watchers to stop async iterators immediately
    for (const watcher of watchers) {
      try {
        watcher.close();
      } catch {
        // Ignore close errors
      }
    }
  };
}

/**
 * Checks if a change requires a full rebuild.
 *
 * System files, layouts, and config changes affect all pages.
 *
 * @param changes Array of file changes
 * @returns True if full rebuild is needed
 */
export function requiresFullRebuild(changes: FileChange[]): boolean {
  return changes.some(
    (change) =>
      change.type === "layout" ||
      change.type === "system" ||
      change.type === "config",
  );
}
