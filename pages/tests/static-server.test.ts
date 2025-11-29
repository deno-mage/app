/**
 * Tests for the static server.
 *
 * @module
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import { pages } from "../api.ts";
import { stopBundleBuilder } from "../bundle-builder.ts";
import { MageTestServer } from "../../test-utils/server.ts";

const FIXTURES_DIR = join(import.meta.dirname!, "fixtures", "build-test");

describe(
  "static server",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    let server: MageTestServer;
    let buildDir: string;

    beforeAll(async () => {
      // Build the site to a temp directory
      buildDir = await Deno.makeTempDir();

      const api = pages({
        siteMetadata: {
          baseUrl: "https://example.com",
        },
      });

      await api.build({
        rootDir: FIXTURES_DIR,
        outDir: buildDir,
      });

      // Start server serving the built files
      server = new MageTestServer();
      api.registerStaticServer(server.app, {
        rootDir: buildDir,
      });
      server.start();
    });

    afterAll(async () => {
      await server.stop();
      await stopBundleBuilder();
      await Deno.remove(buildDir, { recursive: true });
    });

    it("should serve index.html at root path", async () => {
      const response = await fetch(server.url("/"));

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/html");

      const html = await response.text();
      expect(html).toContain("<title>Home</title>");
      expect(html).toContain("This is the home page");
    });

    it("should serve nested pages", async () => {
      const response = await fetch(server.url("/docs/intro"));

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/html");

      const html = await response.text();
      expect(html).toContain("<title>Introduction</title>");
    });

    it("should serve hashed assets from __public", async () => {
      // First get the index page to find the hashed asset URL
      const indexResponse = await fetch(server.url("/"));
      const html = await indexResponse.text();

      // Extract the hashed CSS URL from the HTML
      const cssMatch = html.match(/\/__public\/styles-[a-f0-9]+\.css/);
      expect(cssMatch).not.toBeNull();

      // Fetch the hashed asset
      const cssResponse = await fetch(server.url(cssMatch![0]));

      expect(cssResponse.status).toBe(200);
      expect(cssResponse.headers.get("content-type")).toContain("text/css");

      const css = await cssResponse.text();
      expect(css).toContain("body");
    });

    it("should serve hashed bundles from __bundles", async () => {
      // First get the index page to find the bundle URL
      const indexResponse = await fetch(server.url("/"));
      const html = await indexResponse.text();

      // Extract the bundle script URL
      const bundleMatch = html.match(/\/__bundles\/[^"]+\.js/);
      expect(bundleMatch).not.toBeNull();

      // Fetch the bundle
      const bundleResponse = await fetch(server.url(bundleMatch![0]));

      expect(bundleResponse.status).toBe(200);
      expect(bundleResponse.headers.get("content-type")).toContain(
        "javascript",
      );
      await bundleResponse.text();
    });

    it("should serve custom 404 page for missing routes", async () => {
      const response = await fetch(server.url("/does-not-exist"));

      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toContain("text/html");

      const html = await response.text();
      expect(html).toContain("Page Not Found");
    });

    it("should return 404 for path traversal attempts", async () => {
      const response = await fetch(server.url("/../../../etc/passwd"));

      expect(response.status).toBe(404);
      await response.text();
    });
  },
);

describe(
  "static server with basePath (trailing slash)",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    let server: MageTestServer;
    let buildDir: string;

    beforeAll(async () => {
      buildDir = await Deno.makeTempDir();

      const api = pages({
        siteMetadata: {
          baseUrl: "https://example.com",
        },
      });

      await api.build({
        rootDir: FIXTURES_DIR,
        outDir: buildDir,
        basePath: "/docs",
      });

      server = new MageTestServer();
      // basePath WITH trailing slash
      api.registerStaticServer(server.app, {
        rootDir: buildDir,
        basePath: "/docs/",
      });
      server.start();
    });

    afterAll(async () => {
      await server.stop();
      await stopBundleBuilder();
      await Deno.remove(buildDir, { recursive: true });
    });

    it("should serve pages under basePath", async () => {
      const response = await fetch(server.url("/docs/"));

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("<title>Home</title>");
    });
  },
);

describe(
  "static server with basePath (no trailing slash)",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    let server: MageTestServer;
    let buildDir: string;

    beforeAll(async () => {
      buildDir = await Deno.makeTempDir();

      const api = pages({
        siteMetadata: {
          baseUrl: "https://example.com",
        },
      });

      await api.build({
        rootDir: FIXTURES_DIR,
        outDir: buildDir,
        basePath: "/app",
      });

      server = new MageTestServer();
      // basePath WITHOUT trailing slash - tests normalizeBasePath branch
      api.registerStaticServer(server.app, {
        rootDir: buildDir,
        basePath: "/app",
      });
      server.start();
    });

    afterAll(async () => {
      await server.stop();
      await stopBundleBuilder();
      await Deno.remove(buildDir, { recursive: true });
    });

    it("should normalize basePath and serve pages", async () => {
      const response = await fetch(server.url("/app/"));

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("<title>Home</title>");
    });

    it("should return 404 for root when basePath is set", async () => {
      const response = await fetch(server.url("/"));

      expect(response.status).toBe(404);
      await response.text();
    });
  },
);

describe(
  "static server without custom 404 page",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    let server: MageTestServer;
    let buildDir: string;

    beforeAll(async () => {
      // Create a minimal build directory without _not-found.html
      buildDir = await Deno.makeTempDir();
      await Deno.writeTextFile(
        join(buildDir, "index.html"),
        "<html><body>Hello</body></html>",
      );

      const api = pages({
        siteMetadata: {
          baseUrl: "https://example.com",
        },
      });

      server = new MageTestServer();
      api.registerStaticServer(server.app, {
        rootDir: buildDir,
      });
      server.start();
    });

    afterAll(async () => {
      await server.stop();
      await Deno.remove(buildDir, { recursive: true });
    });

    it("should use default notFound when _not-found.html missing", async () => {
      const response = await fetch(server.url("/does-not-exist"));

      expect(response.status).toBe(404);
      const text = await response.text();
      expect(text).toBe("Not Found");
    });
  },
);
