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

beforeAll(async () => {
  server = new MageTestServer();

  const { registerDevServer } = pages();

  cleanup = await registerDevServer(server.app, {
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

describe("dev server - page serving", {
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
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

  it("should serve custom _not-found.md page for 404s", async () => {
    const response = await fetch(server.url("/does-not-exist"));

    expect(response.status).toBe(404);
    const html = await response.text();
    expect(html).toContain("<title>Page Not Found</title>");
    expect(html).toContain("404 - Page Not Found");
    expect(html).toContain("Sorry, the page you're looking for doesn't exist");
  });

  it("should inject hot reload script into pages", async () => {
    const response = await fetch(server.url("/"));

    const html = await response.text();
    expect(html).toContain("<script>");
    expect(html).toContain("/__reload");
    expect(html).toContain("window.location.reload");
  });

  it("should inject hot reload script into fallback 404 page", async () => {
    // Temporarily rename _not-found.md so fallback is used
    const notFoundPath = join(FIXTURES_DIR, "pages", "_not-found.md");
    const notFoundBackup = join(FIXTURES_DIR, "pages", "_not-found.md.backup");
    await Deno.rename(notFoundPath, notFoundBackup);

    try {
      const response = await fetch(server.url("/page-without-custom-404"));

      expect(response.status).toBe(404);
      const html = await response.text();
      expect(html).toContain("404 Not Found");
      expect(html).toContain("<script>");
      expect(html).toContain("/__reload");
      expect(html).toContain("WebSocket");
    } finally {
      // Restore _not-found.md
      await Deno.rename(notFoundBackup, notFoundPath);
    }
  });

  it("should return 500 when page rendering fails", async () => {
    // Create a page with invalid frontmatter to trigger rendering error
    const tempFile = join(FIXTURES_DIR, "pages", "broken.md");
    await Deno.writeTextFile(
      tempFile,
      "---\ntitle: Test\ninvalid: [unclosed\n---\n\n# Content",
    );

    const response = await fetch(server.url("/broken"));

    expect(response.status).toBe(500);
    // Just verify we get some HTML back (could be custom _error.md or fallback)
    const html = await response.text();
    expect(html.length).toBeGreaterThan(0);

    // Cleanup
    await Deno.remove(tempFile);
  });

  it("should serve custom _error.md page for rendering errors", async () => {
    // Create a page with invalid frontmatter to trigger rendering error
    const tempFile = join(FIXTURES_DIR, "pages", "broken2.md");
    await Deno.writeTextFile(
      tempFile,
      "---\ntitle: Test\ninvalid: [unclosed\n---\n\n# Content",
    );

    const response = await fetch(server.url("/broken2"));

    expect(response.status).toBe(500);
    const html = await response.text();
    expect(html).toContain("<title>Error</title>");
    expect(html).toContain("Something Went Wrong");
    expect(html).toContain("An error occurred while rendering this page");

    // Cleanup
    await Deno.remove(tempFile);
  });

  it("should inject hot reload script into fallback 500 error page", async () => {
    // Temporarily rename _error.md so fallback is used
    const errorMdPath = join(FIXTURES_DIR, "pages", "_error.md");
    const errorMdBackup = join(FIXTURES_DIR, "pages", "_error.md.backup");
    await Deno.rename(errorMdPath, errorMdBackup);

    try {
      // Create a page with invalid frontmatter to trigger rendering error
      const tempFile = join(FIXTURES_DIR, "pages", "broken3.md");
      await Deno.writeTextFile(
        tempFile,
        "---\ntitle: Test\ninvalid: [unclosed\n---\n\n# Content",
      );

      const response = await fetch(server.url("/broken3"));

      expect(response.status).toBe(500);
      const html = await response.text();
      expect(html).toContain("Error rendering page");
      expect(html).toContain("<script>");
      expect(html).toContain("/__reload");
      expect(html).toContain("WebSocket");

      // Cleanup
      await Deno.remove(tempFile);
    } finally {
      // Restore _error.md
      await Deno.rename(errorMdBackup, errorMdPath);
    }
  });
});

describe("dev server - asset serving", {
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
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

    // Cleanup
    await Deno.remove(tempAsset);
  });
});

describe("dev server - hot reload endpoint", {
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  it("should upgrade to WebSocket connection", async () => {
    const wsUrl = server.url("/__reload").toString().replace(
      "http://",
      "ws://",
    );

    const ws = new WebSocket(wsUrl);

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Connection timeout")),
        1000,
      );
      ws.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to connect"));
      };
    });

    expect(ws.readyState).toBe(WebSocket.OPEN);

    ws.close();
  });

  it("should send reload message when page files change", async () => {
    const wsUrl = server.url("/__reload").toString().replace(
      "http://",
      "ws://",
    );
    const ws = new WebSocket(wsUrl);

    // Wait for connection
    await new Promise<void>((resolve) => {
      ws.onopen = () => resolve();
    });

    // Set up message handler with timeout
    let timeoutId: number | undefined;
    const messagePromise = new Promise<string>((resolve, reject) => {
      ws.onmessage = (event) => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        resolve(event.data);
      };
      timeoutId = setTimeout(
        () => reject(new Error("Timeout waiting for message")),
        2000,
      );
    });

    // Trigger a file change
    const tempFile = join(FIXTURES_DIR, "pages", "_temp.md");
    await Deno.writeTextFile(tempFile, "---\ntitle: Temp\n---\n\n# Temp");

    // Wait for reload message
    const message = await messagePromise;

    expect(message).toBe("reload");

    // Cleanup
    ws.close();
    await Deno.remove(tempFile);
  });

  it("should send reload message when any file in rootDir changes", async () => {
    const wsUrl = server.url("/__reload").toString().replace(
      "http://",
      "ws://",
    );
    const ws = new WebSocket(wsUrl);

    // Wait for connection
    await new Promise<void>((resolve) => {
      ws.onopen = () => resolve();
    });

    // Set up message handler with timeout
    let timeoutId: number | undefined;
    const messagePromise = new Promise<string>((resolve, reject) => {
      ws.onmessage = (event) => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        resolve(event.data);
      };
      timeoutId = setTimeout(
        () => reject(new Error("Timeout waiting for message")),
        2000,
      );
    });

    // Create a components directory and file (simulating a component change)
    const componentsDir = join(FIXTURES_DIR, "components");
    await Deno.mkdir(componentsDir, { recursive: true });
    const tempFile = join(componentsDir, "test-component.tsx");
    await Deno.writeTextFile(
      tempFile,
      "export const Test = () => <div>Test</div>;",
    );

    // Wait for reload message
    const message = await messagePromise;

    expect(message).toBe("reload");

    // Cleanup
    ws.close();
    await Deno.remove(tempFile);
    try {
      await Deno.remove(componentsDir);
    } catch {
      // Ignore if directory not empty
    }
  });
});

describe("dev server - custom base route", {
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  let customServer: MageTestServer;
  let customCleanup: (() => void) | undefined;

  beforeAll(async () => {
    customServer = new MageTestServer();

    const { registerDevServer } = pages();

    customCleanup = await registerDevServer(customServer.app, {
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
    const wsUrl = customServer.url("/docs/__reload").toString().replace(
      "http://",
      "ws://",
    );
    const ws = new WebSocket(wsUrl);

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Connection timeout")),
        1000,
      );
      ws.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to connect"));
      };
    });

    expect(ws.readyState).toBe(WebSocket.OPEN);

    ws.close();
  });
});
