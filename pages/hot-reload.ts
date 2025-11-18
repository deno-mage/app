/**
 * Hot reload utilities for development mode.
 *
 * Injects a script that connects via WebSocket and reloads on changes.
 *
 * @module
 */

import { logger } from "./logger.ts";

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
export function notifyClients(): void {
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
}

/**
 * Generates hot reload script to inject into HTML.
 *
 * The script connects via WebSocket and reloads the page when the server
 * signals a change.
 */
export function generateHotReloadScript(reloadEndpoint: string): string {
  return `
<script>
(function() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const ws = new WebSocket(protocol + '//' + host + '${reloadEndpoint}');

  ws.onmessage = function() {
    console.log('[pages] Reloading...');
    window.location.reload();
  };

  ws.onclose = function() {
    console.log('[pages] Disconnected, retrying in 1s...');
    setTimeout(function() {
      window.location.reload();
    }, 1000);
  };

  ws.onerror = function() {
    console.log('[pages] Connection error');
  };

  console.log('[pages] Hot reload enabled');
})();
</script>`;
}

/**
 * Injects hot reload script into HTML before closing body tag.
 */
export function injectHotReload(html: string, reloadEndpoint: string): string {
  const script = generateHotReloadScript(reloadEndpoint);

  // Try to inject before </body>
  if (html.includes("</body>")) {
    return html.replace("</body>", `${script}\n</body>`);
  }

  // Fallback: append at end
  return html + script;
}
