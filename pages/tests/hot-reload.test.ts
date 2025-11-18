import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import {
  generateHotReloadScript,
  injectHotReload,
  ReloadManager,
} from "../hot-reload.ts";

describe("hot-reload - script generation", () => {
  it("should generate script with reload endpoint", () => {
    const script = generateHotReloadScript("/__reload");

    expect(script).toContain("<script>");
    expect(script).toContain("</script>");
    expect(script).toContain("/__reload");
    expect(script).toContain("fetch");
  });

  it("should include polling logic", () => {
    const script = generateHotReloadScript("/__reload");

    expect(script).toContain("setInterval");
    expect(script).toContain("1000");
  });

  it("should include reload logic", () => {
    const script = generateHotReloadScript("/__reload");

    expect(script).toContain("window.location.reload");
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

describe("hot-reload - ReloadManager", () => {
  it("should start with no reload needed", () => {
    const manager = new ReloadManager();

    expect(manager.checkAndReset()).toBe(false);
  });

  it("should trigger reload", () => {
    const manager = new ReloadManager();

    manager.triggerReload();

    expect(manager.checkAndReset()).toBe(true);
  });

  it("should reset after check", () => {
    const manager = new ReloadManager();

    manager.triggerReload();
    expect(manager.checkAndReset()).toBe(true);
    expect(manager.checkAndReset()).toBe(false);
  });

  it("should handle multiple triggers before check", () => {
    const manager = new ReloadManager();

    manager.triggerReload();
    manager.triggerReload();
    manager.triggerReload();

    expect(manager.checkAndReset()).toBe(true);
    expect(manager.checkAndReset()).toBe(false);
  });
});
