import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import {
  buildAssetMap,
  buildHashedFilename,
  replaceAssetUrls,
  resolveAssetPath,
} from "../assets.ts";

const FIXTURES_DIR = join(
  new URL(".", import.meta.url).pathname,
  "fixtures",
);

describe("assets - hashed filename building", () => {
  it("should build hashed filename with extension", () => {
    const result = buildHashedFilename("styles.css", "abc123");

    expect(result).toBe("styles-abc123.css");
  });

  it("should handle nested paths", () => {
    const result = buildHashedFilename("images/logo.png", "def456");

    expect(result).toBe("images/logo-def456.png");
  });

  it("should handle files without extension", () => {
    const result = buildHashedFilename("README", "xyz789");

    expect(result).toBe("README-xyz789");
  });

  it("should handle multiple dots in filename", () => {
    const result = buildHashedFilename("app.min.js", "abc123");

    expect(result).toBe("app.min-abc123.js");
  });
});

describe("assets - asset map building", () => {
  it("should build asset map from public directory", async () => {
    const publicDir = join(FIXTURES_DIR, "public");
    const assetMap = await buildAssetMap(publicDir);

    expect(assetMap.size).toBeGreaterThan(0);

    // Check that CSS file is mapped
    const cssEntry = Array.from(assetMap.entries()).find(([clean]) =>
      clean.includes("styles.css")
    );
    expect(cssEntry).toBeDefined();
    expect(cssEntry![0]).toBe("/public/styles.css");
    expect(cssEntry![1]).toMatch(/^\/__public\/styles-[a-f0-9]{8}\.css$/);
  });

  it("should handle nested files", async () => {
    const publicDir = join(FIXTURES_DIR, "public");
    const assetMap = await buildAssetMap(publicDir);

    const logoEntry = Array.from(assetMap.entries()).find(([clean]) =>
      clean.includes("logo.png")
    );
    expect(logoEntry).toBeDefined();
    expect(logoEntry![0]).toBe("/public/images/logo.png");
    expect(logoEntry![1]).toMatch(
      /^\/__public\/images\/logo-[a-f0-9]{8}\.png$/,
    );
  });

  it("should return empty map for non-existent directory", async () => {
    const publicDir = join(FIXTURES_DIR, "nonexistent");
    const assetMap = await buildAssetMap(publicDir);

    expect(assetMap.size).toBe(0);
  });

  it("should generate consistent hashes for same content", async () => {
    const publicDir = join(FIXTURES_DIR, "public");
    const assetMap1 = await buildAssetMap(publicDir);
    const assetMap2 = await buildAssetMap(publicDir);

    expect(assetMap1).toEqual(assetMap2);
  });
});

describe("assets - URL replacement", () => {
  it("should replace URLs in double quotes", () => {
    const html = '<link rel="stylesheet" href="/public/styles.css">';
    const assetMap = new Map([
      ["/public/styles.css", "/__public/styles-abc123.css"],
    ]);

    const result = replaceAssetUrls(html, assetMap);

    expect(result).toBe(
      '<link rel="stylesheet" href="/__public/styles-abc123.css">',
    );
  });

  it("should replace URLs in single quotes", () => {
    const html = "<link rel='stylesheet' href='/public/styles.css'>";
    const assetMap = new Map([
      ["/public/styles.css", "/__public/styles-abc123.css"],
    ]);

    const result = replaceAssetUrls(html, assetMap);

    expect(result).toBe(
      "<link rel='stylesheet' href='/__public/styles-abc123.css'>",
    );
  });

  it("should replace URLs in CSS url() functions", () => {
    const html = "<style>body { background: url(/public/bg.png); }</style>";
    const assetMap = new Map([
      ["/public/bg.png", "/__public/bg-def456.png"],
    ]);

    const result = replaceAssetUrls(html, assetMap);

    expect(result).toBe(
      "<style>body { background: url(/__public/bg-def456.png); }</style>",
    );
  });

  it("should replace multiple occurrences of same URL", () => {
    const html = `
      <link rel="stylesheet" href="/public/styles.css">
      <link rel="preload" href="/public/styles.css" as="style">
    `;
    const assetMap = new Map([
      ["/public/styles.css", "/__public/styles-abc123.css"],
    ]);

    const result = replaceAssetUrls(html, assetMap);

    expect(result).toContain("/__public/styles-abc123.css");
    expect(result.match(/__public\/styles-abc123\.css/g)?.length).toBe(2);
  });

  it("should replace multiple different URLs", () => {
    const html = `
      <link href="/public/styles.css">
      <script src="/public/app.js"></script>
      <img src="/public/logo.png">
    `;
    const assetMap = new Map([
      ["/public/styles.css", "/__public/styles-abc123.css"],
      ["/public/app.js", "/__public/app-def456.js"],
      ["/public/logo.png", "/__public/logo-ghi789.png"],
    ]);

    const result = replaceAssetUrls(html, assetMap);

    expect(result).toContain("/__public/styles-abc123.css");
    expect(result).toContain("/__public/app-def456.js");
    expect(result).toContain("/__public/logo-ghi789.png");
  });

  it("should not replace URLs not in asset map", () => {
    const html = '<img src="/public/unknown.png">';
    const assetMap = new Map([
      ["/public/styles.css", "/__public/styles-abc123.css"],
    ]);

    const result = replaceAssetUrls(html, assetMap);

    expect(result).toBe('<img src="/public/unknown.png">');
  });

  it("should handle empty asset map", () => {
    const html = '<link href="/public/styles.css">';
    const assetMap = new Map();

    const result = replaceAssetUrls(html, assetMap);

    expect(result).toBe(html);
  });
});

describe("assets - asset path resolution", () => {
  it("should resolve hashed URL back to clean path", () => {
    const assetMap = new Map([
      ["/public/styles.css", "/__public/styles-abc123.css"],
    ]);

    const result = resolveAssetPath("/__public/styles-abc123.css", assetMap);

    expect(result).toBe("styles.css");
  });

  it("should resolve nested paths", () => {
    const assetMap = new Map([
      ["/public/images/logo.png", "/__public/images/logo-def456.png"],
    ]);

    const result = resolveAssetPath(
      "/__public/images/logo-def456.png",
      assetMap,
    );

    expect(result).toBe("images/logo.png");
  });

  it("should return null for unknown hashed URL", () => {
    const assetMap = new Map([
      ["/public/styles.css", "/__public/styles-abc123.css"],
    ]);

    const result = resolveAssetPath("/__public/unknown-xyz789.css", assetMap);

    expect(result).toBeNull();
  });

  it("should return null for empty asset map", () => {
    const assetMap = new Map();

    const result = resolveAssetPath("/__public/styles-abc123.css", assetMap);

    expect(result).toBeNull();
  });
});
