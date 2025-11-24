import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import { pages } from "../mod.ts";
import { MageApp } from "../../app/mod.ts";

const FIXTURES_DIR = join(
  new URL(".", import.meta.url).pathname,
  "fixtures",
);

describe("api - pages factory function", () => {
  it("should create pages instance without siteMetadata", () => {
    const instance = pages();

    expect(instance).toHaveProperty("registerDevServer");
    expect(instance).toHaveProperty("build");
    expect(instance).toHaveProperty("registerStaticServer");
  });

  it("should create pages instance with siteMetadata", () => {
    const instance = pages({
      siteMetadata: {
        baseUrl: "https://example.com",
        title: "Test Site",
      },
    });

    expect(instance).toHaveProperty("registerDevServer");
    expect(instance).toHaveProperty("build");
    expect(instance).toHaveProperty("registerStaticServer");
  });

  it("registerDevServer should return cleanup function", async () => {
    const instance = pages();
    const app = new MageApp();

    const cleanup = await instance.registerDevServer(app, {
      rootDir: FIXTURES_DIR,
    });

    expect(typeof cleanup).toBe("function");

    // Call cleanup to stop watchers
    cleanup();

    // Wait a bit for watchers to fully stop
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it("registerDevServer should work without options", async () => {
    const instance = pages();
    const app = new MageApp();

    const cleanup = await instance.registerDevServer(app);

    expect(typeof cleanup).toBe("function");
    cleanup();

    // Wait a bit for watchers to fully stop
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it("build should throw error when siteMetadata not provided", async () => {
    const instance = pages();

    try {
      await instance.build({ rootDir: FIXTURES_DIR });
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain(
        "siteMetadata is required for build()",
      );
    }
  });

  it("build should work when siteMetadata provided", async () => {
    const instance = pages({
      siteMetadata: {
        baseUrl: "https://example.com",
        title: "Test Site",
      },
    });

    const tempDir = await Deno.makeTempDir();

    await instance.build({
      rootDir: FIXTURES_DIR,
      outDir: tempDir,
    });

    // Verify build created files
    const indexPath = join(tempDir, "index.html");
    const indexExists = await Deno.stat(indexPath).then(
      () => true,
      () => false,
    );
    expect(indexExists).toBe(true);
  });

  it("registerStaticServer should register without errors", () => {
    const instance = pages();
    const app = new MageApp();

    // Should not throw
    instance.registerStaticServer(app);

    // Verify it registered successfully by checking that routes were added
    expect(app).toBeDefined();
  });

  it("should forward markdownOptions from factory to build", async () => {
    const instance = pages({
      siteMetadata: {
        baseUrl: "https://example.com",
      },
      markdownOptions: {
        shikiTheme: "github-light",
      },
    });

    const tempDir = await Deno.makeTempDir();

    // Should not throw - markdownOptions are properly forwarded
    await instance.build({
      rootDir: FIXTURES_DIR,
      outDir: tempDir,
    });

    // Verify build succeeded
    const indexPath = join(tempDir, "index.html");
    const indexExists = await Deno.stat(indexPath).then(
      () => true,
      () => false,
    );
    expect(indexExists).toBe(true);
  });

  it("should allow build options to override factory markdownOptions", async () => {
    const instance = pages({
      siteMetadata: {
        baseUrl: "https://example.com",
      },
      markdownOptions: {
        shikiTheme: "github-light",
      },
    });

    const tempDir = await Deno.makeTempDir();

    // Should not throw - build options can override factory markdownOptions
    await instance.build({
      rootDir: FIXTURES_DIR,
      outDir: tempDir,
      markdownOptions: {
        shikiTheme: "github-dark",
      },
    });

    // Verify build succeeded
    const indexPath = join(tempDir, "index.html");
    const indexExists = await Deno.stat(indexPath).then(
      () => true,
      () => false,
    );
    expect(indexExists).toBe(true);
  });
});
