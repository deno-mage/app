/**
 * Tests for asset management utilities.
 *
 * @module
 */

import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import {
  buildAssetMap,
  buildHashedFilename,
  replaceAssetUrls,
  resolveAssetPath,
} from "../assets.ts";

const FIXTURES_DIR = join(import.meta.dirname!, "fixtures", "build-test");

describe("buildHashedFilename", () => {
  it("should insert hash before extension", () => {
    expect(buildHashedFilename("styles.css", "abc123")).toBe(
      "styles-abc123.css",
    );
  });

  it("should handle nested paths", () => {
    expect(buildHashedFilename("images/logo.png", "def456")).toBe(
      "images/logo-def456.png",
    );
  });

  it("should handle deeply nested paths", () => {
    expect(buildHashedFilename("assets/images/icons/icon.svg", "abc123")).toBe(
      "assets/images/icons/icon-abc123.svg",
    );
  });

  it("should handle files without extension", () => {
    expect(buildHashedFilename("LICENSE", "abc123")).toBe("LICENSE-abc123");
  });

  it("should handle files with multiple dots", () => {
    expect(buildHashedFilename("jquery.min.js", "abc123")).toBe(
      "jquery.min-abc123.js",
    );
  });

  it("should handle hidden files", () => {
    expect(buildHashedFilename(".gitignore", "abc123")).toBe(
      "-abc123.gitignore",
    );
  });

  it("should handle empty hash", () => {
    expect(buildHashedFilename("styles.css", "")).toBe("styles-.css");
  });
});

describe("buildAssetMap", () => {
  it("should build map from public directory", async () => {
    const publicDir = join(FIXTURES_DIR, "public");
    const assetMap = await buildAssetMap(publicDir);

    expect(assetMap.size).toBeGreaterThan(0);

    // Check that styles.css is mapped
    const stylesEntry = Array.from(assetMap.entries()).find(([key]) =>
      key.includes("styles.css")
    );
    expect(stylesEntry).toBeDefined();
    expect(stylesEntry![0]).toBe("/public/styles.css");
    expect(stylesEntry![1]).toMatch(/^\/__public\/styles-[a-f0-9]{8}\.css$/);
  });

  it("should handle nested directories", async () => {
    const publicDir = join(FIXTURES_DIR, "public");
    const assetMap = await buildAssetMap(publicDir);

    // Check that images/logo.png is mapped
    const logoEntry = Array.from(assetMap.entries()).find(([key]) =>
      key.includes("logo.png")
    );
    expect(logoEntry).toBeDefined();
    expect(logoEntry![0]).toBe("/public/images/logo.png");
    expect(logoEntry![1]).toMatch(
      /^\/__public\/images\/logo-[a-f0-9]{8}\.png$/,
    );
  });

  it("should return empty map for non-existent directory", async () => {
    const assetMap = await buildAssetMap("/non/existent/path");
    expect(assetMap.size).toBe(0);
  });

  it("should respect basePath parameter", async () => {
    const publicDir = join(FIXTURES_DIR, "public");
    const assetMap = await buildAssetMap(publicDir, "/docs/");

    const stylesEntry = Array.from(assetMap.entries()).find(([key]) =>
      key.includes("styles.css")
    );
    expect(stylesEntry).toBeDefined();
    expect(stylesEntry![1]).toMatch(
      /^\/docs\/__public\/styles-[a-f0-9]{8}\.css$/,
    );
  });

  it("should generate consistent hashes for same content", async () => {
    const publicDir = join(FIXTURES_DIR, "public");

    const assetMap1 = await buildAssetMap(publicDir);
    const assetMap2 = await buildAssetMap(publicDir);

    const hash1 = assetMap1.get("/public/styles.css");
    const hash2 = assetMap2.get("/public/styles.css");

    expect(hash1).toBe(hash2);
  });
});

describe("replaceAssetUrls", () => {
  it("should replace URLs in double quotes", () => {
    const assetMap = new Map([
      ["/public/styles.css", "/__public/styles-abc123.css"],
    ]);
    const html = '<link rel="stylesheet" href="/public/styles.css">';

    const result = replaceAssetUrls(html, assetMap);

    expect(result).toBe(
      '<link rel="stylesheet" href="/__public/styles-abc123.css">',
    );
  });

  it("should replace URLs in single quotes", () => {
    const assetMap = new Map([
      ["/public/styles.css", "/__public/styles-abc123.css"],
    ]);
    const html = "<link rel='stylesheet' href='/public/styles.css'>";

    const result = replaceAssetUrls(html, assetMap);

    expect(result).toBe(
      "<link rel='stylesheet' href='/__public/styles-abc123.css'>",
    );
  });

  it("should replace URLs in CSS url()", () => {
    const assetMap = new Map([
      ["/public/images/bg.png", "/__public/images/bg-abc123.png"],
    ]);
    const html =
      "<style>body { background: url(/public/images/bg.png); }</style>";

    const result = replaceAssetUrls(html, assetMap);

    expect(result).toBe(
      "<style>body { background: url(/__public/images/bg-abc123.png); }</style>",
    );
  });

  it("should replace multiple occurrences", () => {
    const assetMap = new Map([
      ["/public/styles.css", "/__public/styles-abc123.css"],
    ]);
    const html =
      '<link href="/public/styles.css"><link href="/public/styles.css">';

    const result = replaceAssetUrls(html, assetMap);

    expect(result).toBe(
      '<link href="/__public/styles-abc123.css"><link href="/__public/styles-abc123.css">',
    );
  });

  it("should replace multiple different assets", () => {
    const assetMap = new Map([
      ["/public/styles.css", "/__public/styles-abc123.css"],
      ["/public/script.js", "/__public/script-def456.js"],
    ]);
    const html =
      '<link href="/public/styles.css"><script src="/public/script.js"></script>';

    const result = replaceAssetUrls(html, assetMap);

    expect(result).toBe(
      '<link href="/__public/styles-abc123.css"><script src="/__public/script-def456.js"></script>',
    );
  });

  it("should replace when asset path is a prefix of longer path", () => {
    // This is expected behavior - the regex matches the asset path
    // followed by any character. If you have styles.css and styles.css.map,
    // add styles.css.map to the asset map separately.
    const assetMap = new Map([
      ["/public/styles.css", "/__public/styles-abc123.css"],
    ]);
    const html = '<link href="/public/styles.css.map">';

    const result = replaceAssetUrls(html, assetMap);

    // The .css part is replaced since it matches the pattern
    expect(result).toBe('<link href="/__public/styles-abc123.css.map">');
  });

  it("should handle empty asset map", () => {
    const assetMap = new Map<string, string>();
    const html = '<link href="/public/styles.css">';

    const result = replaceAssetUrls(html, assetMap);

    expect(result).toBe(html);
  });

  it("should handle empty HTML", () => {
    const assetMap = new Map([
      ["/public/styles.css", "/__public/styles-abc123.css"],
    ]);

    const result = replaceAssetUrls("", assetMap);

    expect(result).toBe("");
  });

  it("should handle special regex characters in paths", () => {
    const assetMap = new Map([
      ["/public/file[1].css", "/__public/file[1]-abc123.css"],
    ]);
    const html = '<link href="/public/file[1].css">';

    const result = replaceAssetUrls(html, assetMap);

    expect(result).toBe('<link href="/__public/file[1]-abc123.css">');
  });
});

describe("resolveAssetPath", () => {
  it("should resolve hashed URL to clean path", () => {
    const assetMap = new Map([
      ["/public/styles.css", "/__public/styles-abc123.css"],
    ]);

    const result = resolveAssetPath("/__public/styles-abc123.css", assetMap);

    expect(result).toBe("styles.css");
  });

  it("should resolve nested paths", () => {
    const assetMap = new Map([
      ["/public/images/logo.png", "/__public/images/logo-abc123.png"],
    ]);

    const result = resolveAssetPath(
      "/__public/images/logo-abc123.png",
      assetMap,
    );

    expect(result).toBe("images/logo.png");
  });

  it("should return null for unknown URL", () => {
    const assetMap = new Map([
      ["/public/styles.css", "/__public/styles-abc123.css"],
    ]);

    const result = resolveAssetPath("/__public/unknown-abc123.css", assetMap);

    expect(result).toBeNull();
  });

  it("should return null for empty asset map", () => {
    const assetMap = new Map<string, string>();

    const result = resolveAssetPath("/__public/styles-abc123.css", assetMap);

    expect(result).toBeNull();
  });

  it("should handle basePath in hashed URLs", () => {
    const assetMap = new Map([
      ["/public/styles.css", "/docs/__public/styles-abc123.css"],
    ]);

    const result = resolveAssetPath(
      "/docs/__public/styles-abc123.css",
      assetMap,
    );

    expect(result).toBe("styles.css");
  });

  it("should return null for path traversal attempts", () => {
    const assetMap = new Map([
      ["/public/../etc/passwd", "/__public/passwd-abc123"],
    ]);

    const result = resolveAssetPath("/__public/passwd-abc123", assetMap);

    expect(result).toBeNull();
  });

  it("should return null for absolute paths in clean URL", () => {
    const assetMap = new Map([
      ["/public//etc/passwd", "/__public/passwd-abc123"],
    ]);

    // After replacing /public/, we get "/etc/passwd" which starts with /
    const result = resolveAssetPath("/__public/passwd-abc123", assetMap);

    expect(result).toBeNull();
  });
});
