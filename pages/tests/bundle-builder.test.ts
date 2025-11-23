import { afterAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import {
  buildBundle,
  buildSSRBundle,
  generateEntryPoint,
  stopBundleBuilder,
} from "../bundle-builder.ts";

const FIXTURES_DIR = join(
  new URL(".", import.meta.url).pathname,
  "fixtures",
);

describe("bundle-builder - entry point generation", {
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  // Clean up esbuild after all tests
  afterAll(() => {
    stopBundleBuilder();
  });
  it("should generate valid entry point code", () => {
    const layoutPath = "/path/to/layout.tsx";
    const pageId = "index";

    const entry = generateEntryPoint(layoutPath, pageId);

    expect(entry).toContain('import { hydrate } from "preact"');
    expect(entry).toContain("import { ErrorBoundary } from");
    expect(entry).toContain(
      'import LayoutComponent from "/path/to/layout.tsx"',
    );
    expect(entry).toContain('document.getElementById("app")');
    expect(entry).toContain("window.__PAGE_PROPS__");
    expect(entry).toContain("querySelector('[data-mage-content=\"true\"]')");
    expect(entry).toContain("<ErrorBoundary>");
    expect(entry).toContain("<LayoutComponent {...props} />");
    expect(entry).toContain("</ErrorBoundary>");
  });

  it("should include error handling in entry point", () => {
    const entry = generateEntryPoint("/layout.tsx", "test");

    expect(entry).toContain("try {");
    expect(entry).toContain("catch (error)");
    expect(entry).toContain("[Mage Pages] Hydration failed");
  });

  it("should handle missing app root", () => {
    const entry = generateEntryPoint("/layout.tsx", "test");

    expect(entry).toContain("if (!appRoot)");
    expect(entry).toContain("[Mage Pages] Failed to find #app element");
  });
});

describe("bundle-builder - development mode", {
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  it("should build bundle in development mode", async () => {
    const layoutPath = join(FIXTURES_DIR, "layouts", "default.tsx");

    const result = await buildBundle({
      layoutPath,
      rootDir: FIXTURES_DIR,
      production: false,
      pageId: "test",
    });

    expect(result.code).toBeTruthy();
    // Check for strings from our entry point that won't be mangled
    expect(result.code).toContain("[Mage Pages]");
    expect(result.code).toContain("__PAGE_PROPS__");
    expect(result.code).toContain("data-mage-content");
    expect(result.filename).toBeUndefined();
  });

  it("should include inline sourcemap in development", async () => {
    const layoutPath = join(FIXTURES_DIR, "layouts", "default.tsx");

    const result = await buildBundle({
      layoutPath,
      rootDir: FIXTURES_DIR,
      production: false,
      pageId: "test",
    });

    expect(result.code).toContain("//# sourceMappingURL=");
  });

  it("should not minify code in development", async () => {
    const layoutPath = join(FIXTURES_DIR, "layouts", "default.tsx");

    const result = await buildBundle({
      layoutPath,
      rootDir: FIXTURES_DIR,
      production: false,
      pageId: "test",
    });

    // Development code should have newlines and be readable
    expect(result.code).toContain("\n");
    expect(result.code.length).toBeGreaterThan(1000);
  });
});

describe("bundle-builder - production mode", {
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  it("should build bundle in production mode", async () => {
    const layoutPath = join(FIXTURES_DIR, "layouts", "default.tsx");

    const result = await buildBundle({
      layoutPath,
      rootDir: FIXTURES_DIR,
      production: true,
      pageId: "test",
    });

    expect(result.code).toBeTruthy();
    expect(result.filename).toBeTruthy();
    expect(result.filename).toMatch(/^test-[a-f0-9]{8}\.js$/);
  });

  it("should minify code in production", async () => {
    const layoutPath = join(FIXTURES_DIR, "layouts", "default.tsx");

    const devResult = await buildBundle({
      layoutPath,
      rootDir: FIXTURES_DIR,
      production: false,
      pageId: "test",
    });

    const prodResult = await buildBundle({
      layoutPath,
      rootDir: FIXTURES_DIR,
      production: true,
      pageId: "test",
    });

    // Production should be smaller (minified)
    expect(prodResult.code.length).toBeLessThan(devResult.code.length);
  });

  it("should not include sourcemap in production", async () => {
    const layoutPath = join(FIXTURES_DIR, "layouts", "default.tsx");

    const result = await buildBundle({
      layoutPath,
      rootDir: FIXTURES_DIR,
      production: true,
      pageId: "test",
    });

    expect(result.code).not.toContain("sourceMappingURL");
  });

  it("should generate consistent hash for same content", async () => {
    const layoutPath = join(FIXTURES_DIR, "layouts", "default.tsx");

    const result1 = await buildBundle({
      layoutPath,
      rootDir: FIXTURES_DIR,
      production: true,
      pageId: "test",
    });

    const result2 = await buildBundle({
      layoutPath,
      rootDir: FIXTURES_DIR,
      production: true,
      pageId: "test",
    });

    expect(result1.filename).toBe(result2.filename);
  });

  it("should generate different hash for different page IDs", async () => {
    const layoutPath = join(FIXTURES_DIR, "layouts", "default.tsx");

    const result1 = await buildBundle({
      layoutPath,
      rootDir: FIXTURES_DIR,
      production: true,
      pageId: "page1",
    });

    const result2 = await buildBundle({
      layoutPath,
      rootDir: FIXTURES_DIR,
      production: true,
      pageId: "page2",
    });

    // Different page IDs in entry point = different code = different hash
    expect(result1.filename).not.toBe(result2.filename);
  });
});

describe("bundle-builder - SSR bundling", {
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  it("should build SSR bundle for layout", async () => {
    const layoutPath = join(FIXTURES_DIR, "layouts", "default.tsx");

    const bundledCode = await buildSSRBundle(layoutPath, FIXTURES_DIR);

    expect(bundledCode).toBeTruthy();
    expect(typeof bundledCode).toBe("string");
    // Should be bundled ESM code
    expect(bundledCode).toContain("export");
  });

  it("should bundle layout with dependencies", async () => {
    const layoutPath = join(FIXTURES_DIR, "layouts", "default.tsx");

    const bundledCode = await buildSSRBundle(layoutPath, FIXTURES_DIR);

    // Should produce bundled code (Preact is external, so bundle is smaller)
    expect(bundledCode.length).toBeGreaterThan(500);
    // Should contain import statements for external Preact
    expect(bundledCode).toContain('from "preact/jsx-runtime"');
  });

  it("should produce valid ESM module", async () => {
    const layoutPath = join(FIXTURES_DIR, "layouts", "default.tsx");

    const bundledCode = await buildSSRBundle(layoutPath, FIXTURES_DIR);

    // Should have default export
    expect(bundledCode).toContain("default");
  });
});
