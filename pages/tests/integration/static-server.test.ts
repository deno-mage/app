import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import { MageTestServer } from "../../../test-utils/server.ts";
import { pages } from "../../mod.ts";
import { build } from "../../build.ts";
import type { SiteMetadata } from "../../types.ts";

const FIXTURES_DIR = join(
  new URL(".", import.meta.url).pathname,
  "../fixtures",
);

let server: MageTestServer;
let distDir: string;

const siteMetadata: SiteMetadata = {
  baseUrl: "https://example.com",
  title: "Test Site",
  description: "A test site",
};

beforeAll(async () => {
  // Create temp directory for build output
  distDir = await Deno.makeTempDir();

  // Build static site first
  await build(siteMetadata, {
    rootDir: FIXTURES_DIR,
    outDir: distDir,
  });

  // Setup static server
  server = new MageTestServer();

  const { registerStaticServer } = pages();

  registerStaticServer(server.app, {
    rootDir: distDir,
    route: "/",
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
  // Clean up temp directory
  await Deno.remove(distDir, { recursive: true });
});

describe("static server - page serving", () => {
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
    await response.body?.cancel();
  });

  it("should serve custom 404.html for non-existent pages", async () => {
    const response = await fetch(server.url("/does-not-exist"));

    expect(response.status).toBe(404);
    const html = await response.text();
    expect(html).toContain("<title>Page Not Found</title>");
    expect(html).toContain("404 - Page Not Found");
    expect(html).toContain("Sorry, the page you're looking for doesn't exist");
  });

  it("should NOT inject hot reload script into pages", async () => {
    const response = await fetch(server.url("/"));

    const html = await response.text();
    expect(html).not.toContain("/__reload");
    expect(html).not.toContain("window.location.reload");
  });

  it("should serve HTML with cache-busted asset URLs", async () => {
    const response = await fetch(server.url("/"));

    const html = await response.text();
    expect(html).toMatch(/__public\/styles-[a-f0-9]{8}\.css/);
    expect(html).not.toContain("/public/styles.css");
  });
});

describe("static server - asset serving", () => {
  it("should serve hashed assets from __public", async () => {
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

      const css = await assetResponse.text();
      expect(css).toContain("body");
      expect(css).toContain("margin");
    }
  });

  it("should return 404 for non-existent assets", async () => {
    const response = await fetch(server.url("/__public/nonexistent.css"));

    expect(response.status).toBe(404);
    await response.body?.cancel();
  });

  it("should serve nested assets with directory structure", async () => {
    const response = await fetch(server.url("/"));
    const html = await response.text();

    // Extract hashed image URL from HTML (if any)
    const match = html.match(/__public\/images\/logo-([a-f0-9]{8})\.png/);

    if (match) {
      const hashedUrl = `/__public/images/logo-${match[1]}.png`;
      const assetResponse = await fetch(server.url(hashedUrl));

      expect(assetResponse.status).toBe(200);
      expect(assetResponse.headers.get("content-type")).toContain("image/png");
      await assetResponse.body?.cancel();
    }
  });

  it("should serve assets with correct content type", async () => {
    const response = await fetch(server.url("/"));
    const html = await response.text();

    const cssMatch = html.match(/__public\/styles-([a-f0-9]{8})\.css/);
    if (cssMatch) {
      const cssResponse = await fetch(
        server.url(`/__public/styles-${cssMatch[1]}.css`),
      );
      expect(cssResponse.headers.get("content-type")).toContain("text/css");
      await cssResponse.body?.cancel();
    }

    const pngMatch = html.match(/__public\/images\/logo-([a-f0-9]{8})\.png/);
    if (pngMatch) {
      const pngResponse = await fetch(
        server.url(`/__public/images/logo-${pngMatch[1]}.png`),
      );
      expect(pngResponse.headers.get("content-type")).toContain("image/png");
      await pngResponse.body?.cancel();
    }
  });
});

describe("static server - sitemap and robots.txt", () => {
  it("should serve sitemap.xml", async () => {
    const response = await fetch(server.url("/sitemap.xml"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("xml");

    const sitemap = await response.text();
    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toContain("https://example.com/");
  });

  it("should serve robots.txt", async () => {
    const response = await fetch(server.url("/robots.txt"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");

    const robots = await response.text();
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Sitemap: https://example.com/sitemap.xml");
  });
});

describe("static server - custom base route", () => {
  let customServer: MageTestServer;
  let customDistDir: string;

  beforeAll(async () => {
    // Create temp directory for build output
    customDistDir = await Deno.makeTempDir();

    // Build static site
    await build(siteMetadata, {
      rootDir: FIXTURES_DIR,
      outDir: customDistDir,
    });

    // Setup static server with custom route
    customServer = new MageTestServer();

    const { registerStaticServer } = pages();

    registerStaticServer(customServer.app, {
      rootDir: customDistDir,
      route: "/docs/",
    });

    customServer.start();
  });

  afterAll(async () => {
    await customServer.stop();
    await Deno.remove(customDistDir, { recursive: true });
  });

  it("should serve pages under custom base route", async () => {
    const response = await fetch(customServer.url("/docs/"));

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("<title>Home</title>");
  });

  it("should serve nested pages under custom base route", async () => {
    const response = await fetch(customServer.url("/docs/docs/intro"));

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("<title>Introduction</title>");
  });

  it("should serve assets under base route (but build was for /)", async () => {
    const response = await fetch(customServer.url("/docs/"));
    const html = await response.text();

    // Build was done for "/" so assets are at /__public/, not /docs/__public/
    const match = html.match(/\/__public\/styles-([a-f0-9]{8})\.css/);
    expect(match).toBeTruthy();

    if (match) {
      // When serving under /docs/, the /__public/ assets are at /docs/__public/
      const hashedUrl = `/docs/__public/styles-${match[1]}.css`;
      const assetResponse = await fetch(customServer.url(hashedUrl));

      expect(assetResponse.status).toBe(200);
      await assetResponse.body?.cancel();
    }
  });
});

describe("static server - file path resolution", () => {
  it("should resolve root path to index.html", async () => {
    const response = await fetch(server.url("/"));

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("<title>Home</title>");
  });

  it("should resolve nested paths to directory/index.html", async () => {
    const response = await fetch(server.url("/docs/intro"));

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("<title>Introduction</title>");
  });

  it("should handle paths without trailing slash", async () => {
    const response = await fetch(server.url("/docs/intro"));

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("<title>Introduction</title>");
  });
});

describe("static server - fallback 404 when no custom 404.html", () => {
  let fallbackServer: MageTestServer;
  let fallbackDistDir: string;

  beforeAll(async () => {
    // Create temp directory and build WITHOUT _not-found.md
    const tempFixturesDir = await Deno.makeTempDir();
    fallbackDistDir = await Deno.makeTempDir();

    // Copy fixtures but exclude _not-found.md
    const tempPagesDir = join(tempFixturesDir, "pages");
    const tempLayoutsDir = join(tempFixturesDir, "layouts");
    const tempPublicDir = join(tempFixturesDir, "public");

    await Deno.mkdir(tempPagesDir, { recursive: true });
    await Deno.mkdir(tempLayoutsDir, { recursive: true });
    await Deno.mkdir(tempPublicDir, { recursive: true });

    // Copy only index.md (not _not-found.md)
    await Deno.copyFile(
      join(FIXTURES_DIR, "pages", "index.md"),
      join(tempPagesDir, "index.md"),
    );

    // Copy layout
    await Deno.copyFile(
      join(FIXTURES_DIR, "layouts", "default.tsx"),
      join(tempLayoutsDir, "default.tsx"),
    );

    // Build static site (without _not-found.md, so no 404.html)
    await build(siteMetadata, {
      rootDir: tempFixturesDir,
      outDir: fallbackDistDir,
    });

    // Setup static server
    fallbackServer = new MageTestServer();

    const { registerStaticServer } = pages();

    registerStaticServer(fallbackServer.app, {
      rootDir: fallbackDistDir,
      route: "/",
    });

    fallbackServer.start();
  });

  afterAll(async () => {
    await fallbackServer.stop();
    await Deno.remove(fallbackDistDir, { recursive: true });
  });

  it("should fall back to default 404 when no 404.html exists", async () => {
    const response = await fetch(fallbackServer.url("/does-not-exist"));

    expect(response.status).toBe(404);
    const text = await response.text();
    // Should get the default "Not Found" text response
    expect(text).toContain("Not Found");
  });
});
