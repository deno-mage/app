/**
 * Tests for dev-server module.
 *
 * @module
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import { MageTestServer } from "../../test-utils/server.ts";
import { registerDevServer } from "../dev-server.ts";
import { stopBundleBuilder } from "../bundle-builder.ts";

const FIXTURES_DIR = join(import.meta.dirname!, "fixtures", "build-test");

describe(
  "dev server",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    let server: MageTestServer;
    let cleanup: () => Promise<void>;

    beforeAll(async () => {
      server = new MageTestServer();
      cleanup = await registerDevServer(server.app, {
        rootDir: FIXTURES_DIR,
      });
      server.start();
    });

    afterAll(async () => {
      await cleanup();
      await server.stop();
      await stopBundleBuilder();
    });

    describe("TSX page rendering", () => {
      it("should render TSX pages with correct content", async () => {
        const response = await fetch(server.url("/"));

        expect(response.status).toBe(200);

        const html = await response.text();
        expect(html).toContain("<!DOCTYPE html>");
        expect(html).toContain("<h1>Welcome</h1>");
        expect(html).toContain("This is the home page.");
      });

      it("should apply layouts to TSX pages", async () => {
        const response = await fetch(server.url("/"));

        const html = await response.text();
        expect(html).toContain("<main>");
      });
    });

    describe("Markdown page rendering", () => {
      it("should render markdown pages", async () => {
        const response = await fetch(server.url("/docs/intro"));

        expect(response.status).toBe(200);

        const html = await response.text();
        expect(html).toContain("<!DOCTYPE html>");
        expect(html).toContain("Introduction");
        expect(html).toContain("markdown page");
      });

      it("should render markdown content and code blocks", async () => {
        const response = await fetch(server.url("/docs/intro"));

        const html = await response.text();
        expect(html).toContain('id="introduction"');
        expect(html).toContain("markdown page");
      });
    });

    describe("hydration", () => {
      it("should inject hydration bundle script", async () => {
        const response = await fetch(server.url("/"));

        const html = await response.text();
        expect(html).toContain('script type="module"');
        expect(html).toContain("__dev-bundles");
      });

      it("should inject __PAGE_PROPS__ with frontmatter", async () => {
        const response = await fetch(server.url("/"));

        const html = await response.text();
        expect(html).toContain("__PAGE_PROPS__");
        expect(html).toContain('"title":"Home"');
      });

      it("should wrap content in #app div", async () => {
        const response = await fetch(server.url("/"));

        const html = await response.text();
        expect(html).toContain('<div id="app">');
      });
    });

    describe("hot reload", () => {
      it("should inject hot reload client script", async () => {
        const response = await fetch(server.url("/"));

        const html = await response.text();
        expect(html).toContain("__hot-reload");
        expect(html).toContain("WebSocket");
      });

      it("should accept WebSocket connections", async () => {
        const ws = new WebSocket(server.wsUrl("/__hot-reload"));

        const message = await new Promise<string>((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("WebSocket timeout")),
            5000,
          );

          ws.onmessage = (event) => {
            clearTimeout(timeout);
            resolve(event.data);
          };

          ws.onerror = (event) => {
            clearTimeout(timeout);
            reject(event);
          };
        });

        const parsed = JSON.parse(message);
        expect(parsed.type).toBe("connected");

        const closed = new Promise<void>((resolve) => {
          ws.onclose = () => resolve();
        });
        ws.close();
        await closed;
      });
    });

    describe("caching headers", () => {
      it("should set Cache-Control: no-store for pages", async () => {
        const response = await fetch(server.url("/"));

        expect(response.headers.get("Cache-Control")).toBe("no-store");
      });
    });

    describe("404 handling", () => {
      it("should return 404 for non-existent pages", async () => {
        const response = await fetch(server.url("/this-page-does-not-exist"));

        expect(response.status).toBe(404);
        await response.text();
      });

      it("should render custom _not-found page if present", async () => {
        const response = await fetch(server.url("/missing-page"));

        expect(response.status).toBe(404);

        const html = await response.text();
        expect(html).toContain("Page Not Found");
      });
    });

    describe("error handling", () => {
      it("should show error overlay when page throws", async () => {
        const response = await fetch(server.url("/throws"));

        expect(response.status).toBe(500);

        const html = await response.text();
        expect(html).toContain("Build Error");
        expect(html).toContain("Intentional error for testing");
      });

      it("should include hot reload script in error overlay", async () => {
        const response = await fetch(server.url("/throws"));

        const html = await response.text();
        expect(html).toContain("__hot-reload");
      });
    });

    describe("public assets", () => {
      it("should serve files from public directory", async () => {
        const response = await fetch(server.url("/public/styles.css"));

        expect(response.status).toBe(200);

        const css = await response.text();
        expect(css).toContain("body");
        expect(css).toContain("color: red");
      });

      it("should return 404 for non-existent public assets", async () => {
        const response = await fetch(server.url("/public/does-not-exist.css"));

        expect(response.status).toBe(404);
        await response.text();
      });

      it("should block path traversal attempts", async () => {
        const response = await fetch(
          server.url("/public/../../../etc/passwd"),
        );

        expect(response.status).toBe(404);
        await response.text();
      });
    });
  },
);

describe(
  "dev server with basePath",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    let server: MageTestServer;
    let cleanup: () => Promise<void>;

    beforeAll(async () => {
      server = new MageTestServer();
      cleanup = await registerDevServer(server.app, {
        rootDir: FIXTURES_DIR,
        basePath: "/docs",
      });
      server.start();
    });

    afterAll(async () => {
      await cleanup();
      await server.stop();
      await stopBundleBuilder();
    });

    it("should serve pages under basePath", async () => {
      const response = await fetch(server.url("/docs/"));

      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain("Welcome");
    });

    it("should include basePath in bundle URLs", async () => {
      const response = await fetch(server.url("/docs/"));

      const html = await response.text();
      expect(html).toContain("/docs/__dev-bundles/");
    });

    it("should accept WebSocket connections at basePath", async () => {
      const ws = new WebSocket(server.wsUrl("/docs/__hot-reload"));

      const message = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("WebSocket timeout")),
          5000,
        );

        ws.onmessage = (event) => {
          clearTimeout(timeout);
          resolve(event.data);
        };

        ws.onerror = (event) => {
          clearTimeout(timeout);
          reject(event);
        };
      });

      const parsed = JSON.parse(message);
      expect(parsed.type).toBe("connected");

      const closed = new Promise<void>((resolve) => {
        ws.onclose = () => resolve();
      });
      ws.close();
      await closed;
    });
  },
);

describe(
  "dev server initialization",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    afterAll(async () => {
      await stopBundleBuilder();
    });

    it("should return a cleanup function", async () => {
      const server = new MageTestServer();
      const cleanup = await registerDevServer(server.app, {
        rootDir: FIXTURES_DIR,
      });

      expect(typeof cleanup).toBe("function");
      await cleanup();
    });

    it("should not throw when pages directory is empty", async () => {
      const testDir = await Deno.makeTempDir();
      await Deno.mkdir(join(testDir, "pages"));

      try {
        const server = new MageTestServer();
        const cleanup = await registerDevServer(server.app, {
          rootDir: testDir,
        });

        expect(typeof cleanup).toBe("function");
        await cleanup();
      } finally {
        await Deno.remove(testDir, { recursive: true });
      }
    });
  },
);
