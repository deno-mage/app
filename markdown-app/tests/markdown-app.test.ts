import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { markdownApp } from "../markdown-app.ts";
import { MageApp } from "../../app/app.ts";

describe("markdown-app - markdownApp factory", () => {
  describe("validation", () => {
    it("should throw if sourceDir is missing", () => {
      expect(() =>
        markdownApp({
          sourceDir: "",
          outputDir: "/tmp/output",
          layoutDir: "/tmp/layout",
        })
      ).toThrow("markdownApp: sourceDir is required");
    });

    it("should throw if outputDir is missing", () => {
      expect(() =>
        markdownApp({
          sourceDir: "/tmp/source",
          outputDir: "",
          layoutDir: "/tmp/layout",
        })
      ).toThrow("markdownApp: outputDir is required");
    });

    it("should throw if layoutDir is missing", () => {
      expect(() =>
        markdownApp({
          sourceDir: "/tmp/source",
          outputDir: "/tmp/output",
          layoutDir: "",
        })
      ).toThrow("markdownApp: layoutDir is required");
    });

    it("should throw if basePath does not start with /", () => {
      expect(() =>
        markdownApp({
          sourceDir: "/tmp/source",
          outputDir: "/tmp/output",
          layoutDir: "/tmp/layout",
          basePath: "docs",
        })
      ).toThrow(
        "markdownApp: basePath must start with '/' or be exactly '/' (e.g., '/docs' or '/')",
      );
    });

    it("should throw if basePath ends with / (except for root)", () => {
      expect(() =>
        markdownApp({
          sourceDir: "/tmp/source",
          outputDir: "/tmp/output",
          layoutDir: "/tmp/layout",
          basePath: "/docs/",
        })
      ).toThrow(
        "markdownApp: basePath must not end with '/' (it will be normalized automatically)",
      );
    });

    it("should allow basePath of exactly /", () => {
      const tempDir = Deno.makeTempDirSync();

      expect(() =>
        markdownApp({
          sourceDir: tempDir,
          outputDir: tempDir,
          layoutDir: tempDir,
          basePath: "/",
        })
      ).not.toThrow();
    });

    it("should allow valid basePath with leading slash and no trailing slash", () => {
      const tempDir = Deno.makeTempDirSync();

      expect(() =>
        markdownApp({
          sourceDir: tempDir,
          outputDir: tempDir,
          layoutDir: tempDir,
          basePath: "/docs",
        })
      ).not.toThrow();
    });
  });

  describe("register method", () => {
    it("should register middleware with MageApp", () => {
      const tempDir = Deno.makeTempDirSync();
      const app = new MageApp();

      const mdApp = markdownApp({
        sourceDir: tempDir,
        outputDir: tempDir,
        layoutDir: tempDir,
      });

      // Should not throw
      expect(() => mdApp.register(app)).not.toThrow();
    });

    it("should register with custom basePath", () => {
      const tempDir = Deno.makeTempDirSync();
      const app = new MageApp();

      const mdApp = markdownApp({
        sourceDir: tempDir,
        outputDir: tempDir,
        layoutDir: tempDir,
        basePath: "/docs",
      });

      expect(() => mdApp.register(app)).not.toThrow();
    });

    it("should register with dev mode enabled", () => {
      const tempDir = Deno.makeTempDirSync();
      const app = new MageApp();

      const mdApp = markdownApp({
        sourceDir: tempDir,
        outputDir: tempDir,
        layoutDir: tempDir,
        dev: true,
      });

      expect(() => mdApp.register(app)).not.toThrow();
    });
  });

  describe("build method", () => {
    it("should have build method", () => {
      const tempDir = Deno.makeTempDirSync();

      const mdApp = markdownApp({
        sourceDir: tempDir,
        outputDir: tempDir,
        layoutDir: tempDir,
      });

      expect(mdApp.build).toBeDefined();
      expect(typeof mdApp.build).toBe("function");
    });
  });

  describe("watch method", () => {
    it("should have watch method", () => {
      const tempDir = Deno.makeTempDirSync();

      const mdApp = markdownApp({
        sourceDir: tempDir,
        outputDir: tempDir,
        layoutDir: tempDir,
      });

      expect(mdApp.watch).toBeDefined();
      expect(typeof mdApp.watch).toBe("function");
    });
  });

  describe("default options", () => {
    it("should use default basePath of /", () => {
      const tempDir = Deno.makeTempDirSync();
      const app = new MageApp();

      const mdApp = markdownApp({
        sourceDir: tempDir,
        outputDir: tempDir,
        layoutDir: tempDir,
      });

      // Should register with default basePath
      expect(() => mdApp.register(app)).not.toThrow();
    });

    it("should use default dev mode of false", () => {
      const tempDir = Deno.makeTempDirSync();
      const app = new MageApp();

      const mdApp = markdownApp({
        sourceDir: tempDir,
        outputDir: tempDir,
        layoutDir: tempDir,
      });

      expect(() => mdApp.register(app)).not.toThrow();
    });

    it("should accept custom syntaxHighlightLanguages", () => {
      const tempDir = Deno.makeTempDirSync();

      expect(() =>
        markdownApp({
          sourceDir: tempDir,
          outputDir: tempDir,
          layoutDir: tempDir,
          syntaxHighlightLanguages: ["python", "rust", "go"],
        })
      ).not.toThrow();
    });

    it("should accept siteMetadata", () => {
      const tempDir = Deno.makeTempDirSync();

      expect(() =>
        markdownApp({
          sourceDir: tempDir,
          outputDir: tempDir,
          layoutDir: tempDir,
          siteMetadata: {
            siteUrl: "https://example.com",
            siteName: "Test Site",
            description: "A test site",
          },
        })
      ).not.toThrow();
    });

    it("should accept custom assetsDir", () => {
      const tempDir = Deno.makeTempDirSync();

      expect(() =>
        markdownApp({
          sourceDir: tempDir,
          outputDir: tempDir,
          layoutDir: tempDir,
          assetsDir: "custom-assets",
        })
      ).not.toThrow();
    });
  });
});
