/**
 * Constants used throughout the markdown-app module.
 */

/**
 * Prefix for layout file names.
 * Layout files must follow the pattern: _layout-{name}.tsx
 */
export const LAYOUT_PREFIX = "_layout-";

/**
 * File extension for layout files.
 */
export const LAYOUT_SUFFIX = ".tsx";

/**
 * Directory name for output assets.
 * Assets are hashed and copied to this directory to avoid route conflicts.
 */
export const ASSETS_DIR_NAME = "__assets";

/**
 * WebSocket endpoint for hot reload in development mode.
 */
export const HOT_RELOAD_ENDPOINT = "/__hot-reload";

/**
 * Debounce delay in milliseconds for file watcher rebuilds.
 */
export const WATCHER_DEBOUNCE_MS = 100;
