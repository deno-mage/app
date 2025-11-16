import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { markdownApp } from "../markdown-app.ts";
import { MageTestServer } from "../../test-utils/server.ts";
import { join } from "@std/path";
import { copy } from "@std/fs";

const fixturesDir = join(import.meta.dirname!, "fixtures");
const layoutFixture = join(fixturesDir, "layouts", "_layout-docs.tsx");

describe("serving - basic HTTP behavior", () => {
  let server: MageTestServer;
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await Deno.makeTempDir({ prefix: "markdown-app-serving-" });
    const sourceDir = join(tempDir, "source");
    const outputDir = join(tempDir, "output");

    await Deno.mkdir(sourceDir, { recursive: true });
    await copy(layoutFixture, join(sourceDir, "_layout-docs.tsx"));

    await Deno.writeTextFile(
      join(sourceDir, "index.md"),
      `---
title: Home
slug: index
layout: docs
---

# Home Page

Welcome to the site.`,
    );

    await Deno.writeTextFile(
      join(sourceDir, "about.md"),
      `---
title: About
slug: about
layout: docs
---

# About

This is the about page.`,
    );

    await Deno.writeTextFile(
      join(sourceDir, "guide.md"),
      `---
title: Guide
slug: guide/getting-started
layout: docs
---

# Getting Started

This is nested.`,
    );

    const mdApp = markdownApp({
      sourceDir,
      outputDir,
      layoutDir: sourceDir,
      basePath: "/",
      dev: false,
    });

    await mdApp.build();

    server = new MageTestServer();
    mdApp.register(server.app);
    server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it("should serve index.html at root path", async () => {
    const response = await fetch(server.url("/"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");

    const html = await response.text();
    expect(html).toContain("Home Page");
    expect(html).toContain("Welcome to the site");
  });

  it("should serve pages without .html extension", async () => {
    const response = await fetch(server.url("/about"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");

    const html = await response.text();
    expect(html).toContain("About");
    expect(html).toContain("This is the about page");
  });

  it("should serve pages with .html extension", async () => {
    const response = await fetch(server.url("/about.html"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");

    const html = await response.text();
    expect(html).toContain("About");
  });

  it("should serve nested pages", async () => {
    const response = await fetch(server.url("/guide/getting-started"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");

    const html = await response.text();
    expect(html).toContain("Getting Started");
    expect(html).toContain("This is nested");
  });

  it("should return 404 for non-existent pages", async () => {
    const response = await fetch(server.url("/does-not-exist"));

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not Found");
  });

  it("should serve GFM CSS file", async () => {
    const response = await fetch(server.url("/gfm.css"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/css");

    const css = await response.text();
    expect(css.length).toBeGreaterThan(0);
  });
});

describe("serving - basePath", () => {
  let server: MageTestServer;
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await Deno.makeTempDir({ prefix: "markdown-app-basepath-" });
    const sourceDir = join(tempDir, "source");
    const outputDir = join(tempDir, "output");

    await Deno.mkdir(sourceDir, { recursive: true });
    await copy(layoutFixture, join(sourceDir, "_layout-docs.tsx"));

    await Deno.writeTextFile(
      join(sourceDir, "index.md"),
      `---
title: Home
slug: index
layout: docs
---

# Docs Home`,
    );

    await Deno.writeTextFile(
      join(sourceDir, "api.md"),
      `---
title: API
slug: api
layout: docs
---

# API Reference`,
    );

    const mdApp = markdownApp({
      sourceDir,
      outputDir,
      layoutDir: sourceDir,
      basePath: "/docs",
      dev: false,
    });

    await mdApp.build();

    server = new MageTestServer();
    mdApp.register(server.app);
    server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it("should serve pages under basePath", async () => {
    const response = await fetch(server.url("/docs/"));

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Docs Home");
  });

  it("should serve non-root pages under basePath", async () => {
    const response = await fetch(server.url("/docs/api"));

    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("API Reference");
  });

  it("should return 404 for paths outside basePath", async () => {
    const response = await fetch(server.url("/"));

    expect(response.status).toBe(404);
    await response.text(); // Consume body
  });

  it("should return 404 when accessing page at wrong path", async () => {
    const response = await fetch(server.url("/api"));

    expect(response.status).toBe(404);
    await response.text(); // Consume body
  });

  it("should serve static files under basePath", async () => {
    const response = await fetch(server.url("/docs/gfm.css"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/css");
    await response.text(); // Consume body
  });
});

describe("serving - HTTP methods", () => {
  let server: MageTestServer;
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await Deno.makeTempDir({ prefix: "markdown-app-methods-" });
    const sourceDir = join(tempDir, "source");
    const outputDir = join(tempDir, "output");

    await Deno.mkdir(sourceDir, { recursive: true });
    await copy(layoutFixture, join(sourceDir, "_layout-docs.tsx"));

    await Deno.writeTextFile(
      join(sourceDir, "index.md"),
      `---
title: Home
slug: index
layout: docs
---

# Home`,
    );

    const mdApp = markdownApp({
      sourceDir,
      outputDir,
      layoutDir: sourceDir,
      basePath: "/",
      dev: false,
    });

    await mdApp.build();

    server = new MageTestServer();
    mdApp.register(server.app);
    server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it("should allow GET requests", async () => {
    const response = await fetch(server.url("/"), { method: "GET" });

    expect(response.status).toBe(200);
    await response.text(); // Consume body
  });

  it("should allow HEAD requests", async () => {
    const response = await fetch(server.url("/"), { method: "HEAD" });

    expect(response.status).toBe(200);
    await response.text(); // Consume body
  });

  it("should not allow POST requests", async () => {
    const response = await fetch(server.url("/"), { method: "POST" });

    expect(response.status).toBe(405);
    expect(await response.text()).toBe("Method Not Allowed");
  });

  it("should not allow PUT requests", async () => {
    const response = await fetch(server.url("/"), { method: "PUT" });

    expect(response.status).toBe(405);
    await response.text(); // Consume body
  });

  it("should not allow DELETE requests", async () => {
    const response = await fetch(server.url("/"), { method: "DELETE" });

    expect(response.status).toBe(405);
    await response.text(); // Consume body
  });

  it("should not allow PATCH requests", async () => {
    const response = await fetch(server.url("/"), { method: "PATCH" });

    expect(response.status).toBe(405);
    await response.text(); // Consume body
  });
});
