import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import {
  checkUnoConfigExists,
  generateCSS,
  loadUnoConfig,
  processUnoCSS,
  scanSourceFiles,
} from "../unocss.ts";

describe("unocss - config detection", () => {
  it("should return true when uno.config.ts exists", async () => {
    const tempDir = await Deno.makeTempDir();
    await Deno.writeTextFile(
      join(tempDir, "uno.config.ts"),
      'import presetUno from "@unocss/preset-uno"; export default { presets: [presetUno()] };',
    );

    const exists = await checkUnoConfigExists(tempDir);
    expect(exists).toBe(true);
  });

  it("should return false when uno.config.ts does not exist", async () => {
    const tempDir = await Deno.makeTempDir();

    const exists = await checkUnoConfigExists(tempDir);
    expect(exists).toBe(false);
  });
});

describe("unocss - config loading", () => {
  it("should load uno.config.ts successfully", async () => {
    const tempDir = await Deno.makeTempDir();
    await Deno.writeTextFile(
      join(tempDir, "uno.config.ts"),
      'import presetUno from "@unocss/preset-uno"; export default { presets: [presetUno()] };',
    );

    const config = await loadUnoConfig(tempDir);
    expect(config).toBeDefined();
    expect(config.presets).toBeDefined();
    expect(config.presets?.length).toBeGreaterThan(0);
  });

  it("should throw error when config file has invalid syntax", async () => {
    const tempDir = await Deno.makeTempDir();
    await Deno.writeTextFile(
      join(tempDir, "uno.config.ts"),
      "this is not valid typescript",
    );

    await expect(loadUnoConfig(tempDir)).rejects.toThrow();
  });
});

describe("unocss - source file scanning", () => {
  it("should scan markdown files", async () => {
    const tempDir = await Deno.makeTempDir();
    const pagesDir = join(tempDir, "pages");
    await Deno.mkdir(pagesDir, { recursive: true });

    await Deno.writeTextFile(
      join(pagesDir, "index.md"),
      '# Test\n<div class="text-red-500">Hello</div>',
    );

    const content = await scanSourceFiles(tempDir);
    expect(content).toContain("text-red-500");
  });

  it("should scan TypeScript layout files", async () => {
    const tempDir = await Deno.makeTempDir();
    const layoutsDir = join(tempDir, "layouts");
    await Deno.mkdir(layoutsDir, { recursive: true });

    await Deno.writeTextFile(
      join(layoutsDir, "default.tsx"),
      'export default () => <div class="bg-blue-100">Layout</div>;',
    );

    const content = await scanSourceFiles(tempDir);
    expect(content).toContain("bg-blue-100");
  });

  it("should scan root level files", async () => {
    const tempDir = await Deno.makeTempDir();

    await Deno.writeTextFile(
      join(tempDir, "_html.tsx"),
      'export default () => <html><body class="container mx-auto"></body></html>;',
    );

    const content = await scanSourceFiles(tempDir);
    expect(content).toContain("container");
    expect(content).toContain("mx-auto");
  });

  it("should scan all supported file extensions", async () => {
    const tempDir = await Deno.makeTempDir();

    await Deno.writeTextFile(
      join(tempDir, "test.ts"),
      'const x = "text-lg";',
    );
    await Deno.writeTextFile(
      join(tempDir, "test.js"),
      'const y = "font-bold";',
    );
    await Deno.writeTextFile(
      join(tempDir, "test.html"),
      '<div class="p-4">Test</div>',
    );

    const content = await scanSourceFiles(tempDir);
    expect(content).toContain("text-lg");
    expect(content).toContain("font-bold");
    expect(content).toContain("p-4");
  });

  it("should exclude dist directory by default", async () => {
    const tempDir = await Deno.makeTempDir();
    const distDir = join(tempDir, "dist");
    await Deno.mkdir(distDir, { recursive: true });

    await Deno.writeTextFile(
      join(tempDir, "source.md"),
      '<div class="text-blue-500">Source</div>',
    );
    await Deno.writeTextFile(
      join(distDir, "built.html"),
      '<div class="text-red-500">Built</div>',
    );

    const content = await scanSourceFiles(tempDir);
    expect(content).toContain("text-blue-500");
    expect(content).not.toContain("text-red-500");
  });

  it("should exclude custom output directory", async () => {
    const tempDir = await Deno.makeTempDir();
    const buildDir = join(tempDir, "build");
    await Deno.mkdir(buildDir, { recursive: true });

    await Deno.writeTextFile(
      join(tempDir, "source.md"),
      '<div class="text-blue-500">Source</div>',
    );
    await Deno.writeTextFile(
      join(buildDir, "built.html"),
      '<div class="text-red-500">Built</div>',
    );

    const content = await scanSourceFiles(tempDir, "build");
    expect(content).toContain("text-blue-500");
    expect(content).not.toContain("text-red-500");
  });

  it("should exclude node_modules directory", async () => {
    const tempDir = await Deno.makeTempDir();
    const nodeModulesDir = join(tempDir, "node_modules", "some-package");
    await Deno.mkdir(nodeModulesDir, { recursive: true });

    await Deno.writeTextFile(
      join(tempDir, "source.md"),
      '<div class="text-blue-500">Source</div>',
    );
    await Deno.writeTextFile(
      join(nodeModulesDir, "index.js"),
      'const x = "text-red-500";',
    );

    const content = await scanSourceFiles(tempDir);
    expect(content).toContain("text-blue-500");
    expect(content).not.toContain("text-red-500");
  });

  it("should scan nested directories", async () => {
    const tempDir = await Deno.makeTempDir();
    const deepDir = join(tempDir, "pages", "docs", "guides");
    await Deno.mkdir(deepDir, { recursive: true });

    await Deno.writeTextFile(
      join(deepDir, "intro.md"),
      '<div class="text-green-600">Deep file</div>',
    );

    const content = await scanSourceFiles(tempDir);
    expect(content).toContain("text-green-600");
  });
});

describe("unocss - CSS generation", () => {
  it("should generate CSS from content with Tailwind classes", async () => {
    const content = '<div class="text-red-500 bg-blue-100 p-4">Test</div>';
    const result = await generateCSS(content, undefined, "/");

    expect(result.css).toContain("text-red-500");
    expect(result.css).toContain("bg-blue-100");
    expect(result.css).toContain("p-4");
    expect(result.filename).toMatch(/^uno-[a-f0-9]{8}\.css$/);
    expect(result.url).toBe(`/__styles/${result.filename}`);
  });

  it("should generate hashed filename based on CSS content", async () => {
    const content = '<div class="text-red-500">Test</div>';
    const result1 = await generateCSS(content, undefined, "/");
    const result2 = await generateCSS(content, undefined, "/");

    // Same content should produce same hash
    expect(result1.filename).toBe(result2.filename);
  });

  it("should generate different hashes for different content", async () => {
    const content1 = '<div class="text-red-500">Test</div>';
    const content2 = '<div class="text-blue-500">Test</div>';

    const result1 = await generateCSS(content1, undefined, "/");
    const result2 = await generateCSS(content2, undefined, "/");

    expect(result1.filename).not.toBe(result2.filename);
  });

  it("should respect basePath in URL", async () => {
    const content = '<div class="text-red-500">Test</div>';
    const result = await generateCSS(content, undefined, "/docs/");

    expect(result.url).toBe(`/docs/__styles/${result.filename}`);
  });

  it("should include CSS preflights layer", async () => {
    const content = '<div class="text-red-500">Test</div>';
    const result = await generateCSS(content, undefined, "/");

    expect(result.css).toContain("/* layer: preflights */");
  });

  it("should generate responsive container classes", async () => {
    const content = '<div class="container">Test</div>';
    const result = await generateCSS(content, undefined, "/");

    expect(result.css).toContain("container");
    expect(result.css).toContain("max-width");
  });
});

describe("unocss - end-to-end integration", () => {
  it("should gracefully handle config loading errors", async () => {
    const tempDir = await Deno.makeTempDir();
    const outDir = join(tempDir, "dist");

    // Create invalid config that will fail to load
    await Deno.writeTextFile(
      join(tempDir, "uno.config.ts"),
      "this is invalid typescript that will fail to parse",
    );

    // Create source files
    await Deno.writeTextFile(
      join(tempDir, "test.md"),
      '<div class="p-4">Test</div>',
    );

    // Should return undefined and not throw
    const stylesheetUrl = await processUnoCSS(tempDir, outDir, "/");

    expect(stylesheetUrl).toBeUndefined();
  });

  it("should process UnoCSS when config exists", async () => {
    const tempDir = await Deno.makeTempDir();
    const outDir = join(tempDir, "dist");

    // Create config
    await Deno.writeTextFile(
      join(tempDir, "uno.config.ts"),
      'import presetUno from "@unocss/preset-uno"; export default { presets: [presetUno()] };',
    );

    // Create source files
    const pagesDir = join(tempDir, "pages");
    await Deno.mkdir(pagesDir, { recursive: true });
    await Deno.writeTextFile(
      join(pagesDir, "index.md"),
      '<div class="text-4xl font-bold text-blue-600">Title</div>',
    );

    const stylesheetUrl = await processUnoCSS(tempDir, outDir, "/");

    expect(stylesheetUrl).toBeDefined();
    expect(stylesheetUrl).toMatch(/^\/__styles\/uno-[a-f0-9]{8}\.css$/);

    // Verify CSS file was written
    const stylesDir = join(outDir, "__styles");
    const files = [];
    for await (const entry of Deno.readDir(stylesDir)) {
      files.push(entry.name);
    }

    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/^uno-[a-f0-9]{8}\.css$/);

    // Verify CSS content
    const cssContent = await Deno.readTextFile(join(stylesDir, files[0]));
    expect(cssContent).toContain("text-4xl");
    expect(cssContent).toContain("font-bold");
    expect(cssContent).toContain("text-blue-600");
  });

  it("should return undefined when config does not exist", async () => {
    const tempDir = await Deno.makeTempDir();
    const outDir = join(tempDir, "dist");

    const stylesheetUrl = await processUnoCSS(tempDir, outDir, "/");

    expect(stylesheetUrl).toBeUndefined();
  });

  it("should create __styles directory if it doesn't exist", async () => {
    const tempDir = await Deno.makeTempDir();
    const outDir = join(tempDir, "dist");

    // Create config
    await Deno.writeTextFile(
      join(tempDir, "uno.config.ts"),
      'import presetUno from "@unocss/preset-uno"; export default { presets: [presetUno()] };',
    );

    // Create source files
    await Deno.writeTextFile(
      join(tempDir, "test.md"),
      '<div class="p-4">Test</div>',
    );

    await processUnoCSS(tempDir, outDir, "/");

    // Verify __styles directory was created
    const stylesDir = join(outDir, "__styles");
    const stat = await Deno.stat(stylesDir);
    expect(stat.isDirectory).toBe(true);
  });

  it("should handle custom basePath correctly", async () => {
    const tempDir = await Deno.makeTempDir();
    const outDir = join(tempDir, "dist");

    // Create config
    await Deno.writeTextFile(
      join(tempDir, "uno.config.ts"),
      'import presetUno from "@unocss/preset-uno"; export default { presets: [presetUno()] };',
    );

    // Create source files
    await Deno.writeTextFile(
      join(tempDir, "test.md"),
      '<div class="p-4">Test</div>',
    );

    const stylesheetUrl = await processUnoCSS(tempDir, outDir, "/docs/");

    expect(stylesheetUrl).toBeDefined();
    expect(stylesheetUrl).toMatch(/^\/docs\/__styles\/uno-[a-f0-9]{8}\.css$/);
  });
});
