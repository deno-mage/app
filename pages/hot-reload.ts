/**
 * Hot reload utilities for development mode.
 *
 * Injects a script that polls for changes and reloads the page.
 *
 * @module
 */

/**
 * Generates hot reload script to inject into HTML.
 *
 * The script polls a reload endpoint every second and reloads the page
 * when the server signals a change.
 */
export function generateHotReloadScript(reloadEndpoint: string): string {
  return `
<script>
(function() {
  let lastCheck = Date.now();

  function checkForUpdates() {
    fetch('${reloadEndpoint}?t=' + lastCheck)
      .then(res => res.json())
      .then(data => {
        if (data.reload) {
          console.log('[pages] Reloading page...');
          window.location.reload();
        }
        lastCheck = Date.now();
      })
      .catch(err => {
        // Silently ignore errors (dev server might be restarting)
      });
  }

  // Check every second
  setInterval(checkForUpdates, 1000);

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

/**
 * Manages reload state for hot reload endpoint.
 */
export class ReloadManager {
  private shouldReload = false;

  /**
   * Signals that a reload should occur.
   */
  triggerReload(): void {
    this.shouldReload = true;
  }

  /**
   * Checks if reload is needed and resets the flag.
   */
  checkAndReset(): boolean {
    const result = this.shouldReload;
    this.shouldReload = false;
    return result;
  }
}
