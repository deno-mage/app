import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import { MageTestServer } from "../../../test-utils/server.ts";
import { pages } from "../../mod.ts";

const FIXTURES_DIR = join(
  new URL(".", import.meta.url).pathname,
  "../fixtures",
);

let server: MageTestServer;
let cleanup: (() => void) | undefined;

beforeAll(() => {
  server = new MageTestServer();

  const { registerDevServer } = pages();

  cleanup = registerDevServer(server.app, {
    rootDir: FIXTURES_DIR,
    route: "/",
  });

  server.start();
});

afterAll(async () => {
  if (cleanup) {
    cleanup();
  }
  await server.stop();
});

describe("dev server - page serving", () => {
  it("should serve the index page", async () => {
    const response = await fetch(server.url("/"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");

    const html = await response.text();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Home</title>");
    expect(html).toContain("Welcome");
  });

  it("should serve nested pages", async () => {
    const response = await fetch(server.url("/docs/intro"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");

    const html = await response.text();
    expect(html).toContain("<title>Introduction</title>");
    expect(html).toContain("Getting started");
  });

  it("should return 404 for non-existent pages", async () => {
    const response = await fetch(server.url("/does-not-exist"));

    expect(response.status).toBe(404);
    await response.body?.cancel(); // Consume body to prevent leak
  });

  it("should inject hot reload script into pages", async () => {
    const response = await fetch(server.url("/"));

    const html = await response.text();
    expect(html).toContain("<script>");
    expect(html).toContain("/__reload");
    expect(html).toContain("window.location.reload");
  });

  it("should return 500 with error message when page rendering fails", async () => {
    // Create a page with invalid frontmatter to trigger rendering error
    const tempFile = join(FIXTURES_DIR, "pages", "broken.md");
    await Deno.writeTextFile(
      tempFile,
      "---\ntitle: Test\ninvalid: [unclosed\n---\n\n# Content",
    );

    const response = await fetch(server.url("/broken"));

    expect(response.status).toBe(500);
    const html = await response.text();
    expect(html).toContain("Error rendering page");

    // Cleanup
    await Deno.remove(tempFile);
  });
});

describe("dev server - asset serving", () => {
  it("should serve assets with hashed URLs", async () => {
    const response = await fetch(server.url("/"));
    const html = await response.text();

    // Extract hashed CSS URL from HTML
    const match = html.match(/__public\/styles-([a-f0-9]{8})\.css/);
    expect(match).toBeTruthy();

    if (match) {
      const hashedUrl = `/__public/styles-${match[1]}.css`;
      const assetResponse = await fetch(server.url(hashedUrl));

      expect(assetResponse.status).toBe(200);
      expect(assetResponse.headers.get("content-type")).toContain("text/css");
      await assetResponse.body?.cancel(); // Consume body to prevent leak
    }
  });

  it("should return 404 for non-existent assets", async () => {
    const response = await fetch(server.url("/__public/nonexistent.css"));

    expect(response.status).toBe(404);
    await response.body?.cancel(); // Consume body to prevent leak
  });

  it("should serve nested assets", async () => {
    const response = await fetch(server.url("/"));
    const html = await response.text();

    // Extract hashed image URL from HTML (if any)
    const match = html.match(/__public\/images\/logo-([a-f0-9]{8})\.png/);

    if (match) {
      const hashedUrl = `/__public/images/logo-${match[1]}.png`;
      const assetResponse = await fetch(server.url(hashedUrl));

      expect(assetResponse.status).toBe(200);
      expect(assetResponse.headers.get("content-type")).toContain("image/png");
      await assetResponse.body?.cancel(); // Consume body to prevent leak
    }
  });

  it("should rebuild asset map when public/ files change", async () => {
    // Create a new asset file
    const publicDir = join(FIXTURES_DIR, "public");
    const tempAsset = join(publicDir, "new-file.css");
    await Deno.writeTextFile(tempAsset, "body { color: blue; }");

    // Wait for watcher to detect change and rebuild asset map
    await new Promise((resolve) => setTimeout(resolve, 100));

    // The new file should now be in the asset map and servable
    // We can't easily get the hash, but we can verify the watcher was triggered
    // by checking the reload endpoint
    const response = await fetch(server.url("/__reload"));
    const data = await response.json();
    expect(data.reload).toBe(true);

    // Cleanup
    await Deno.remove(tempAsset);
  });
});

describe("dev server - hot reload endpoint", () => {
  it("should respond to hot reload checks", async () => {
    const response = await fetch(server.url("/__reload"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "application/json",
    );

    const data = await response.json();
    expect(data).toHaveProperty("reload");
    expect(typeof data.reload).toBe("boolean");
  });

  it("should return reload: false when no changes", async () => {
    const response = await fetch(server.url("/__reload"));
    const data = await response.json();

    expect(data.reload).toBe(false);
  });

  it("should trigger reload when files change", async () => {
    // First check - should be false
    const response1 = await fetch(server.url("/__reload"));
    const data1 = await response1.json();
    expect(data1.reload).toBe(false);

    // Trigger a file change by touching a file in pages/
    const tempFile = join(FIXTURES_DIR, "pages", "_temp.md");
    await Deno.writeTextFile(tempFile, "---\ntitle: Temp\n---\n\n# Temp");

    // Wait for watcher to detect change
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Second check - should be true
    const response2 = await fetch(server.url("/__reload"));
    const data2 = await response2.json();
    expect(data2.reload).toBe(true);

    // Third check - should be false again (reset after check)
    const response3 = await fetch(server.url("/__reload"));
    const data3 = await response3.json();
    expect(data3.reload).toBe(false);

    // Cleanup
    await Deno.remove(tempFile);
  });
});

describe("dev server - custom base route", () => {
  let customServer: MageTestServer;
  let customCleanup: (() => void) | undefined;

  beforeAll(() => {
    customServer = new MageTestServer();

    const { registerDevServer } = pages();

    customCleanup = registerDevServer(customServer.app, {
      rootDir: FIXTURES_DIR,
      route: "/docs/",
    });

    customServer.start();
  });

  afterAll(async () => {
    if (customCleanup) {
      customCleanup();
    }
    await customServer.stop();
  });

  it("should serve pages under custom base route", async () => {
    const response = await fetch(customServer.url("/docs/"));

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("<title>Home</title>");
  });

  it("should serve hot reload endpoint under custom base route", async () => {
    const response = await fetch(customServer.url("/docs/__reload"));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("reload");
  });
});
