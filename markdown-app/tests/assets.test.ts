import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import { copyAssetsWithHashing, replaceAssetPlaceholders } from "../assets.ts";

describe("markdown-app - assets", () => {
  const tempDir = Deno.makeTempDirSync({ prefix: "markdown-app-assets-test-" });
  const assetsDir = join(tempDir, "assets");
  const outputDir = join(tempDir, "output");

  beforeAll(async () => {
    // Create assets directory with test files
    await Deno.mkdir(assetsDir, { recursive: true });
    await Deno.mkdir(join(assetsDir, "images"), { recursive: true });

    // Create test files with predictable content
    await Deno.writeTextFile(join(assetsDir, "icon.svg"), "<svg>icon</svg>");
    await Deno.writeTextFile(
      join(assetsDir, "images", "logo.png"),
      "PNG_DATA",
    );
    await Deno.writeTextFile(
      join(assetsDir, "styles.css"),
      "body { color: red; }",
    );

    // Create output directory
    await Deno.mkdir(outputDir, { recursive: true });
  });

  afterAll(async () => {
    await Deno.remove(tempDir, { recursive: true });
  });

  describe("copyAssetsWithHashing", () => {
    it("should copy assets with hashed filenames", async () => {
      const assetMap = await copyAssetsWithHashing(
        assetsDir,
        outputDir,
        "/",
      );

      // Check that __assets directory was created
      const assetsOutputDir = join(outputDir, "__assets");
      const stat = await Deno.stat(assetsOutputDir);
      expect(stat.isDirectory).toBe(true);

      // Check that files were copied to __assets/
      const outputFiles = [];
      for await (const entry of Deno.readDir(assetsOutputDir)) {
        if (entry.isFile) {
          outputFiles.push(entry.name);
        }
      }

      // Should have 2 files in __assets root (icon.svg and styles.css)
      expect(outputFiles.length).toBe(2);

      // Files should have hash in name
      const iconFile = outputFiles.find((f) => f.startsWith("icon-"));
      const stylesFile = outputFiles.find((f) => f.startsWith("styles-"));
      expect(iconFile).toBeDefined();
      expect(stylesFile).toBeDefined();

      // Hash should be 8 characters
      expect(iconFile!.match(/icon-([a-f0-9]{8})\.svg/)).toBeTruthy();
      expect(stylesFile!.match(/styles-([a-f0-9]{8})\.css/)).toBeTruthy();

      // Asset map should contain mappings with __assets prefix
      expect(assetMap["icon.svg"]).toMatch(
        /^\/__assets\/icon-[a-f0-9]{8}\.svg$/,
      );
      expect(assetMap["styles.css"]).toMatch(
        /^\/__assets\/styles-[a-f0-9]{8}\.css$/,
      );
      expect(assetMap["images/logo.png"]).toMatch(
        /^\/__assets\/images\/logo-[a-f0-9]{8}\.png$/,
      );
    });

    it("should preserve directory structure", async () => {
      const assetMap = await copyAssetsWithHashing(
        assetsDir,
        outputDir,
        "/",
      );

      // Check that images subdirectory was created under __assets
      const imagesDir = join(outputDir, "__assets", "images");
      const stat = await Deno.stat(imagesDir);
      expect(stat.isDirectory).toBe(true);

      // Check that logo.png was copied to __assets/images/
      const imagesFiles = [];
      for await (const entry of Deno.readDir(imagesDir)) {
        if (entry.isFile) {
          imagesFiles.push(entry.name);
        }
      }

      const logoFile = imagesFiles.find((f) => f.startsWith("logo-"));
      expect(logoFile).toBeDefined();
      expect(logoFile!.match(/logo-([a-f0-9]{8})\.png/)).toBeTruthy();

      // Asset map should include __assets and subdirectory in path
      expect(assetMap["images/logo.png"]).toContain("/__assets/images/");
    });

    it("should handle basePath correctly", async () => {
      const outputDir2 = join(tempDir, "output2");
      await Deno.mkdir(outputDir2, { recursive: true });

      const assetMap = await copyAssetsWithHashing(
        assetsDir,
        outputDir2,
        "/docs",
      );

      // URLs should include basePath and __assets
      expect(assetMap["icon.svg"]).toMatch(
        /^\/docs\/__assets\/icon-[a-f0-9]{8}\.svg$/,
      );
      expect(assetMap["styles.css"]).toMatch(
        /^\/docs\/__assets\/styles-[a-f0-9]{8}\.css$/,
      );
      expect(assetMap["images/logo.png"]).toMatch(
        /^\/docs\/__assets\/images\/logo-[a-f0-9]{8}\.png$/,
      );
    });

    it("should return empty map if assets directory does not exist", async () => {
      const assetMap = await copyAssetsWithHashing(
        "/nonexistent/path",
        outputDir,
        "/",
      );

      expect(assetMap).toEqual({});
    });

    it("should generate consistent hashes for same content", async () => {
      const assetMap1 = await copyAssetsWithHashing(
        assetsDir,
        join(tempDir, "output-hash1"),
        "/",
      );
      const assetMap2 = await copyAssetsWithHashing(
        assetsDir,
        join(tempDir, "output-hash2"),
        "/",
      );

      // Same content should produce same hash
      expect(assetMap1["icon.svg"]).toBe(assetMap2["icon.svg"]);
      expect(assetMap1["styles.css"]).toBe(assetMap2["styles.css"]);
    });
  });

  describe("replaceAssetPlaceholders", () => {
    it("should replace {{assets}} placeholders with hashed paths", () => {
      const assetMap = {
        "icon.svg": "/__assets/icon-a3f2b1c8.svg",
        "images/logo.png": "/__assets/images/logo-d4e5f6a7.png",
      };

      const content = "![Logo]({{assets}}/images/logo.png)";
      const result = replaceAssetPlaceholders(content, assetMap);

      expect(result).toBe("![Logo](/__assets/images/logo-d4e5f6a7.png)");
    });

    it("should handle multiple replacements in same content", () => {
      const assetMap = {
        "icon.svg": "/__assets/icon-a3f2b1c8.svg",
        "images/logo.png": "/__assets/images/logo-d4e5f6a7.png",
      };

      const content =
        "![Icon]({{assets}}/icon.svg) and ![Logo]({{assets}}/images/logo.png)";
      const result = replaceAssetPlaceholders(content, assetMap);

      expect(result).toBe(
        "![Icon](/__assets/icon-a3f2b1c8.svg) and ![Logo](/__assets/images/logo-d4e5f6a7.png)",
      );
    });

    it("should leave placeholder unchanged if asset not found", () => {
      const assetMap = {
        "icon.svg": "/__assets/icon-a3f2b1c8.svg",
      };

      const content = "![Logo]({{assets}}/missing.png)";
      const result = replaceAssetPlaceholders(content, assetMap);

      expect(result).toBe("![Logo]({{assets}}/missing.png)");
    });

    it("should work with link tags in HTML", () => {
      const assetMap = {
        "styles.css": "/__assets/styles-a3f2b1c8.css",
      };

      const content = '<link rel="stylesheet" href="{{assets}}/styles.css">';
      const result = replaceAssetPlaceholders(content, assetMap);

      expect(result).toBe(
        '<link rel="stylesheet" href="/__assets/styles-a3f2b1c8.css">',
      );
    });

    it("should work with nested paths", () => {
      const assetMap = {
        "fonts/roboto/regular.woff2":
          "/__assets/fonts/roboto/regular-f1e2d3c4.woff2",
      };

      const content = "url({{assets}}/fonts/roboto/regular.woff2)";
      const result = replaceAssetPlaceholders(content, assetMap);

      expect(result).toBe("url(/__assets/fonts/roboto/regular-f1e2d3c4.woff2)");
    });

    it("should not replace {{assets}} without following slash", () => {
      const assetMap = {};
      const content = "{{assets}} is the placeholder";
      const result = replaceAssetPlaceholders(content, assetMap);

      expect(result).toBe("{{assets}} is the placeholder");
    });
  });
});
