/**
 * Tests for hot-reload module.
 *
 * @module
 */

import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import {
  createHotReloadServer,
  HOT_RELOAD_CLIENT_SCRIPT,
  injectHotReloadScript,
} from "../hot-reload.ts";

describe("createHotReloadServer", () => {
  it("should create a server with required methods", () => {
    const server = createHotReloadServer();

    expect(typeof server.reload).toBe("function");
    expect(typeof server.sendError).toBe("function");
    expect(typeof server.handleUpgrade).toBe("function");
    expect(typeof server.close).toBe("function");

    server.close();
  });

  it("should not throw when calling reload with no clients", () => {
    const server = createHotReloadServer();

    expect(() => server.reload()).not.toThrow();

    server.close();
  });

  it("should not throw when calling sendError with no clients", () => {
    const server = createHotReloadServer();

    expect(() => server.sendError("test error", "stack trace")).not.toThrow();

    server.close();
  });

  it("should not throw when calling close multiple times", () => {
    const server = createHotReloadServer();

    expect(() => {
      server.close();
      server.close();
    }).not.toThrow();
  });

  it("should handle sendError with only message (no stack)", () => {
    const server = createHotReloadServer();

    expect(() => server.sendError("error without stack")).not.toThrow();

    server.close();
  });
});

describe("HOT_RELOAD_CLIENT_SCRIPT", () => {
  describe("WebSocket connection", () => {
    it("should construct WebSocket URL from current location", () => {
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("location.protocol");
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("location.host");
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("'/__hot-reload'");
    });

    it("should support both ws and wss protocols", () => {
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("wss:");
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("ws:");
    });
  });

  describe("message handlers", () => {
    it("should handle reload message type", () => {
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("case 'reload'");
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("location.reload()");
    });

    it("should handle error message type", () => {
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("case 'error'");
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("showErrorOverlay");
    });

    it("should handle connected message type", () => {
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("case 'connected'");
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("hideErrorOverlay");
    });

    it("should parse JSON messages", () => {
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("JSON.parse");
    });
  });

  describe("reconnection logic", () => {
    it("should have reconnection attempt limit", () => {
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("maxReconnectAttempts");
    });

    it("should have reconnection delay", () => {
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("reconnectDelay");
    });

    it("should reset attempts on successful connection", () => {
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("reconnectAttempts = 0");
    });
  });

  describe("error overlay", () => {
    it("should create overlay element", () => {
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("createElement");
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("mage-error-overlay");
    });

    it("should have dismiss button", () => {
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("Dismiss");
    });

    it("should display error message and stack", () => {
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("message.message");
      expect(HOT_RELOAD_CLIENT_SCRIPT).toContain("message.stack");
    });
  });
});

describe("injectHotReloadScript", () => {
  describe("injection behavior", () => {
    it("should inject script before closing body tag", () => {
      const html = "<html><body><p>Content</p></body></html>";
      const result = injectHotReloadScript(html);

      expect(result).toMatch(/<script>[\s\S]+<\/script><\/body>/);
    });

    it("should preserve all existing body content", () => {
      const html =
        '<html><body><div id="app"><h1>Title</h1><p>Paragraph</p></div></body></html>';
      const result = injectHotReloadScript(html);

      expect(result).toContain('<div id="app">');
      expect(result).toContain("<h1>Title</h1>");
      expect(result).toContain("<p>Paragraph</p>");
    });

    it("should preserve content before body", () => {
      const html =
        "<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>";
      const result = injectHotReloadScript(html);

      expect(result).toContain("<!DOCTYPE html>");
      expect(result).toContain("<title>Test</title>");
    });
  });

  describe("script content", () => {
    it("should include WebSocket connection setup", () => {
      const html = "<html><body></body></html>";
      const result = injectHotReloadScript(html);

      expect(result).toContain("new WebSocket");
    });

    it("should include hot reload endpoint path", () => {
      const html = "<html><body></body></html>";
      const result = injectHotReloadScript(html);

      expect(result).toContain("/__hot-reload");
    });
  });

  describe("edge cases", () => {
    it("should not modify HTML without body tag", () => {
      const html = "<!DOCTYPE html><html><head></head></html>";
      const result = injectHotReloadScript(html);

      expect(result).toBe(html);
    });

    it("should handle self-closing body (invalid but possible)", () => {
      const html = "<html><body/></html>";
      const result = injectHotReloadScript(html);

      // No </body> to match, so unchanged
      expect(result).toBe(html);
    });

    it("should handle body with attributes", () => {
      const html = '<html><body class="dark" data-theme="night"></body></html>';
      const result = injectHotReloadScript(html);

      expect(result).toContain('class="dark"');
      expect(result).toContain('data-theme="night"');
      expect(result).toContain("<script>");
    });

    it("should handle multiple body references in content", () => {
      const html =
        "<html><body><p>The body element is important</p></body></html>";
      const result = injectHotReloadScript(html);

      // Should inject before </body>, not before "body" text
      expect(result).toContain("<p>The body element is important</p>");
      expect(result).toMatch(/<\/script><\/body><\/html>$/);
    });

    it("should handle empty body", () => {
      const html = "<html><body></body></html>";
      const result = injectHotReloadScript(html);

      expect(result).toContain("<script>");
      expect(result).toContain("</script></body>");
    });
  });
});
