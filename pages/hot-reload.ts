/**
 * Hot reload functionality for development server.
 *
 * Provides WebSocket-based communication between server and browser
 * to trigger page reloads on file changes.
 *
 * @module
 */

import type { MageContext } from "../app/mod.ts";

/**
 * Message types for hot reload protocol.
 */
export type HotReloadMessage =
  | { type: "reload" }
  | { type: "error"; message: string; stack?: string }
  | { type: "connected" };

/**
 * Hot reload server that manages WebSocket connections.
 */
export interface HotReloadServer {
  /** Notify all connected clients to reload */
  reload: () => void;
  /** Send an error to all connected clients */
  sendError: (message: string, stack?: string) => void;
  /** Handle a WebSocket upgrade request */
  handleUpgrade: (c: MageContext) => void;
  /** Close all connections and stop the server */
  close: () => void;
}

/**
 * Creates a hot reload server.
 *
 * Manages WebSocket connections and broadcasts reload messages
 * to all connected clients.
 *
 * @returns Hot reload server instance
 */
export function createHotReloadServer(): HotReloadServer {
  const clients = new Set<WebSocket>();

  function broadcast(message: HotReloadMessage): void {
    const data = JSON.stringify(message);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(data);
        } catch {
          // Client disconnected, remove from set
          clients.delete(client);
        }
      }
    }
  }

  return {
    reload(): void {
      broadcast({ type: "reload" });
    },

    sendError(message: string, stack?: string): void {
      broadcast({ type: "error", message, stack });
    },

    handleUpgrade(c: MageContext): void {
      c.webSocket((socket) => {
        socket.onopen = () => {
          clients.add(socket);
          socket.send(JSON.stringify({ type: "connected" }));
        };

        socket.onclose = () => {
          clients.delete(socket);
        };

        socket.onerror = () => {
          clients.delete(socket);
        };
      });
    },

    close(): void {
      for (const client of clients) {
        try {
          client.close();
        } catch {
          // Ignore close errors
        }
      }
      clients.clear();
    },
  };
}

/**
 * Client-side hot reload script.
 *
 * This script is injected into pages during development.
 * It connects to the WebSocket server and reloads the page on changes.
 */
export const HOT_RELOAD_CLIENT_SCRIPT = `
(function() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = protocol + '//' + location.host + '/__hot-reload';

  let ws;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;
  const reconnectDelay = 1000;

  function connect() {
    ws = new WebSocket(wsUrl);

    ws.onopen = function() {
      console.log('[Mage] Hot reload connected');
      reconnectAttempts = 0;
    };

    ws.onmessage = function(event) {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'reload':
          console.log('[Mage] Reloading...');
          location.reload();
          break;
        case 'error':
          console.error('[Mage] Build error:', message.message);
          if (message.stack) {
            console.error(message.stack);
          }
          showErrorOverlay(message.message, message.stack);
          break;
        case 'connected':
          console.log('[Mage] Ready for hot reload');
          hideErrorOverlay();
          break;
      }
    };

    ws.onclose = function() {
      console.log('[Mage] Hot reload disconnected');

      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log('[Mage] Reconnecting in ' + reconnectDelay + 'ms (attempt ' + reconnectAttempts + ')');
        setTimeout(connect, reconnectDelay);
      } else {
        console.log('[Mage] Max reconnection attempts reached');
      }
    };

    ws.onerror = function(error) {
      console.error('[Mage] WebSocket error:', error);
    };
  }

  let overlay = null;

  function showErrorOverlay(message, stack) {
    if (overlay) {
      overlay.remove();
    }

    overlay = document.createElement('div');
    overlay.id = 'mage-error-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);color:#ff6b6b;font-family:monospace;padding:2rem;overflow:auto;z-index:999999;';

    const content = document.createElement('div');
    content.style.cssText = 'max-width:800px;margin:0 auto;';

    const title = document.createElement('h1');
    title.textContent = 'Build Error';
    title.style.cssText = 'color:#ff6b6b;font-size:1.5rem;margin-bottom:1rem;';

    const messageEl = document.createElement('pre');
    messageEl.textContent = message;
    messageEl.style.cssText = 'color:#fff;font-size:1rem;margin-bottom:1rem;white-space:pre-wrap;word-break:break-word;';

    content.appendChild(title);
    content.appendChild(messageEl);

    if (stack) {
      const stackEl = document.createElement('pre');
      stackEl.textContent = stack;
      stackEl.style.cssText = 'color:#888;font-size:0.875rem;white-space:pre-wrap;word-break:break-word;';
      content.appendChild(stackEl);
    }

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Dismiss';
    closeBtn.style.cssText = 'position:fixed;top:1rem;right:1rem;background:#333;color:#fff;border:none;padding:0.5rem 1rem;cursor:pointer;font-family:monospace;';
    closeBtn.onclick = hideErrorOverlay;

    overlay.appendChild(content);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
  }

  function hideErrorOverlay() {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  connect();
})();
`;

/**
 * Injects the hot reload client script into HTML.
 *
 * @param html HTML document string
 * @returns HTML with hot reload script injected
 */
export function injectHotReloadScript(html: string): string {
  const script = `<script>${HOT_RELOAD_CLIENT_SCRIPT}</script>`;
  return html.replace("</body>", `${script}</body>`);
}
