import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { markdownApp } from "../markdown-app.ts";

describe("factory - required options validation", () => {
  it("should fail when sourceDir is missing", () => {
    expect(() => {
      markdownApp({
        sourceDir: "",
        outputDir: "/output",
        layoutDir: "/layouts",
      });
    }).toThrow("markdownApp: sourceDir is required");
  });

  it("should fail when outputDir is missing", () => {
    expect(() => {
      markdownApp({
        sourceDir: "/source",
        outputDir: "",
        layoutDir: "/layouts",
      });
    }).toThrow("markdownApp: outputDir is required");
  });

  it("should fail when layoutDir is missing", () => {
    expect(() => {
      markdownApp({
        sourceDir: "/source",
        outputDir: "/output",
        layoutDir: "",
      });
    }).toThrow("markdownApp: layoutDir is required");
  });
});

describe("factory - basePath validation", () => {
  it("should accept basePath of /", () => {
    expect(() => {
      markdownApp({
        sourceDir: "/source",
        outputDir: "/output",
        layoutDir: "/layouts",
        basePath: "/",
      });
    }).not.toThrow();
  });

  it("should accept valid basePath like /docs", () => {
    expect(() => {
      markdownApp({
        sourceDir: "/source",
        outputDir: "/output",
        layoutDir: "/layouts",
        basePath: "/docs",
      });
    }).not.toThrow();
  });

  it("should fail when basePath does not start with /", () => {
    expect(() => {
      markdownApp({
        sourceDir: "/source",
        outputDir: "/output",
        layoutDir: "/layouts",
        basePath: "docs",
      });
    }).toThrow(
      "markdownApp: basePath must start with '/' or be exactly '/' (e.g., '/docs' or '/')",
    );
  });

  it("should fail when basePath ends with /", () => {
    expect(() => {
      markdownApp({
        sourceDir: "/source",
        outputDir: "/output",
        layoutDir: "/layouts",
        basePath: "/docs/",
      });
    }).toThrow(
      "markdownApp: basePath must not end with '/' (it will be normalized automatically)",
    );
  });
});

describe("factory - API returned", () => {
  it("should return object with register, watch, and build methods", () => {
    const app = markdownApp({
      sourceDir: "/source",
      outputDir: "/output",
      layoutDir: "/layouts",
    });

    expect(app.register).toBeDefined();
    expect(app.watch).toBeDefined();
    expect(app.build).toBeDefined();
    expect(typeof app.register).toBe("function");
    expect(typeof app.watch).toBe("function");
    expect(typeof app.build).toBe("function");
  });
});
