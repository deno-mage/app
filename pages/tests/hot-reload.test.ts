import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import {
  generateHotReloadScript,
  injectHotReload,
  notifyClients,
  registerHotReloadClient,
} from "../hot-reload.ts";

describe("hot-reload - script generation", () => {
  it("should generate script with reload endpoint", () => {
    const script = generateHotReloadScript("/__reload");

    expect(script).toContain("<script>");
    expect(script).toContain("</script>");
    expect(script).toContain("/__reload");
    expect(script).toContain("WebSocket");
  });

  it("should include WebSocket connection logic", () => {
    const script = generateHotReloadScript("/__reload");

    expect(script).toContain("new WebSocket");
    expect(script).toContain("ws.onmessage");
    expect(script).toContain("ws.onclose");
    expect(script).toContain("ws.onerror");
  });

  it("should include reload logic", () => {
    const script = generateHotReloadScript("/__reload");

    expect(script).toContain("window.location.reload");
  });

  it("should handle both ws and wss protocols", () => {
    const script = generateHotReloadScript("/__reload");

    expect(script).toContain("wss:");
    expect(script).toContain("ws:");
  });
});

describe("hot-reload - HTML injection", () => {
  it("should inject script before closing body tag", () => {
    const html = `<html><body><h1>Test</h1></body></html>`;
    const result = injectHotReload(html, "/__reload");

    expect(result).toContain("<script>");
    expect(result).toContain("/__reload");
    expect(result.indexOf("<script>")).toBeLessThan(
      result.indexOf("</body>"),
    );
  });

  it("should handle HTML without body tag", () => {
    const html = `<html><head><title>Test</title></head></html>`;
    const result = injectHotReload(html, "/__reload");

    expect(result).toContain("<script>");
    expect(result).toContain("/__reload");
  });

  it("should preserve existing HTML content", () => {
    const html =
      `<html><body><h1>Content</h1><p>More content</p></body></html>`;
    const result = injectHotReload(html, "/__reload");

    expect(result).toContain("<h1>Content</h1>");
    expect(result).toContain("<p>More content</p>");
  });
});

describe("hot-reload - WebSocket client management", () => {
  it("should register WebSocket client", () => {
    const mockSocket = {
      onclose: null as (() => void) | null,
      onerror: null as (() => void) | null,
      readyState: WebSocket.OPEN,
      send: () => {},
    } as unknown as WebSocket;

    registerHotReloadClient(mockSocket);

    // Should set up handlers
    expect(mockSocket.onclose).not.toBeNull();
    expect(mockSocket.onerror).not.toBeNull();
  });

  it("should notify clients", () => {
    const messages: string[] = [];
    const mockSocket = {
      onclose: null as (() => void) | null,
      onerror: null as (() => void) | null,
      readyState: WebSocket.OPEN,
      send: (msg: string) => messages.push(msg),
    } as unknown as WebSocket;

    registerHotReloadClient(mockSocket);
    notifyClients();

    expect(messages).toContain("reload");
  });

  it("should handle socket errors gracefully", () => {
    const mockSocket = {
      onclose: null as (() => void) | null,
      onerror: null as (() => void) | null,
      readyState: WebSocket.OPEN,
      send: () => {
        throw new Error("Socket error");
      },
    } as unknown as WebSocket;

    registerHotReloadClient(mockSocket);

    // Should not throw
    expect(() => notifyClients()).not.toThrow();
  });
});
