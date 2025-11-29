/**
 * Tests for the pages() public API.
 *
 * @module
 */

import { afterAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import { exists } from "@std/fs";
import { pages } from "../api.ts";
import { stopBundleBuilder } from "../bundle-builder.ts";

const FIXTURES_DIR = join(import.meta.dirname!, "fixtures", "build-test");

describe(
  "pages() API",
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    afterAll(async () => {
      await stopBundleBuilder();
    });

    it("should return an object with registerDevServer, build, and registerStaticServer", () => {
      const api = pages();

      expect(typeof api.registerDevServer).toBe("function");
      expect(typeof api.build).toBe("function");
      expect(typeof api.registerStaticServer).toBe("function");
    });

    it("should throw when build() is called without siteMetadata", async () => {
      const api = pages();

      await expect(api.build()).rejects.toThrow(
        "siteMetadata is required for build()",
      );
    });

    it("should build successfully when siteMetadata is provided", async () => {
      const testOutputDir = await Deno.makeTempDir();

      const api = pages({
        siteMetadata: {
          baseUrl: "https://example.com",
        },
      });

      await api.build({
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      expect(await exists(join(testOutputDir, "index.html"))).toBe(true);
      expect(await exists(join(testOutputDir, "sitemap.xml"))).toBe(true);
      expect(await exists(join(testOutputDir, "robots.txt"))).toBe(true);
    });

    it("should pass markdownOptions from pages() to build()", async () => {
      const testOutputDir = await Deno.makeTempDir();

      const api = pages({
        siteMetadata: {
          baseUrl: "https://example.com",
        },
        markdownOptions: {
          shikiTheme: "github-light",
        },
      });

      await api.build({
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
      });

      // Build should complete without error
      expect(await exists(join(testOutputDir, "docs/intro/index.html"))).toBe(
        true,
      );
    });

    it("should allow buildOptions to override markdownOptions", async () => {
      const testOutputDir = await Deno.makeTempDir();

      const api = pages({
        siteMetadata: {
          baseUrl: "https://example.com",
        },
        markdownOptions: {
          shikiTheme: "github-light",
        },
      });

      await api.build({
        rootDir: FIXTURES_DIR,
        outDir: testOutputDir,
        markdownOptions: {
          shikiTheme: "github-dark",
        },
      });

      expect(await exists(join(testOutputDir, "docs/intro/index.html"))).toBe(
        true,
      );
    });

    it("should throw when registerDevServer is called (not yet implemented)", () => {
      const api = pages();

      expect(() => api.registerDevServer({} as never)).toThrow(
        "Dev server not yet implemented",
      );
    });

    it("should throw when registerStaticServer is called (not yet implemented)", () => {
      const api = pages();

      expect(() => api.registerStaticServer({} as never)).toThrow(
        "Static server not yet implemented",
      );
    });
  },
);
