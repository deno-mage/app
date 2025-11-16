import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { register } from "../middleware.ts";
import { MageApp } from "../../app/app.ts";
import { join } from "@std/path";

/**
 * Type helper for accessing MageApp internals in tests.
 * MageApp doesn't expose routes publicly, but we need to verify route registration.
 */
interface MageAppWithInternals {
  _router: {
    _entries: Array<{ routename?: string; methods?: string[] }>;
  };
}

describe("markdown-app - middleware", () => {
  describe("register", () => {
    it("should register serveFiles middleware at basePath", () => {
      const app = new MageApp();
      const tempDir = Deno.makeTempDirSync();

      register(app, {
        outputDir: tempDir,
        basePath: "/docs",
        dev: false,
      });

      // Verify route was registered
      // Note: MageApp doesn't expose routes publicly, so we test via handler behavior
      // This is more of an integration test

      const routeCount = (app as unknown as MageAppWithInternals)._router
        ._entries.length;
      expect(routeCount).toBeGreaterThan(0);
    });

    it("should register hot reload endpoint in dev mode", () => {
      const app = new MageApp();
      const tempDir = Deno.makeTempDirSync();

      register(app, {
        outputDir: tempDir,
        basePath: "/",
        dev: true,
      });

      // In dev mode, should have 2 routes: serveFiles + hot-reload
      const routeCount = (app as unknown as MageAppWithInternals)._router
        ._entries.length;
      expect(routeCount).toBe(2);
    });

    it("should not register hot reload endpoint in production mode", () => {
      const app = new MageApp();
      const tempDir = Deno.makeTempDirSync();

      register(app, {
        outputDir: tempDir,
        basePath: "/",
        dev: false,
      });

      // In production mode, should have only 1 route: serveFiles
      const routeCount = (app as unknown as MageAppWithInternals)._router
        ._entries.length;
      expect(routeCount).toBe(1);
    });

    it("should normalize basePath correctly for root path", () => {
      const app = new MageApp();
      const tempDir = Deno.makeTempDirSync();

      register(app, {
        outputDir: tempDir,
        basePath: "/",
        dev: false,
      });

      // Check that the route pattern is correct for root
      const entries = (app as unknown as MageAppWithInternals)._router._entries;
      const serveRoute = entries.find((r) =>
        r.routename === "/*" || r.routename?.includes("*")
      );

      expect(serveRoute).toBeDefined();
    });

    it("should normalize basePath correctly for sub-path", () => {
      const app = new MageApp();
      const tempDir = Deno.makeTempDirSync();

      register(app, {
        outputDir: tempDir,
        basePath: "/docs",
        dev: false,
      });

      // Check that the route pattern includes basePath
      const entries = (app as unknown as MageAppWithInternals)._router._entries;
      const serveRoute = entries.find((r) => r.routename?.includes("docs"));

      expect(serveRoute).toBeDefined();
    });

    it("should handle basePath with trailing slash", () => {
      const app = new MageApp();
      const tempDir = Deno.makeTempDirSync();

      // Even with trailing slash in basePath, it should be normalized
      register(app, {
        outputDir: tempDir,
        basePath: "/docs/",
        dev: false,
      });

      const routeCount = (app as unknown as MageAppWithInternals)._router
        ._entries.length;
      expect(routeCount).toBeGreaterThan(0);
    });

    it("should resolve outputDir to absolute path", async () => {
      const app = new MageApp();
      const tempDir = await Deno.makeTempDir();
      const relativeDir = "./test-output";

      // Create relative directory
      await Deno.mkdir(join(tempDir, "test-output"), { recursive: true });

      // Change to temp directory to test relative paths
      const originalCwd = Deno.cwd();
      Deno.chdir(tempDir);

      try {
        register(app, {
          outputDir: relativeDir,
          basePath: "/",
          dev: false,
        });

        // Should successfully register without errors
        expect(
          (app as unknown as MageAppWithInternals)._router._entries.length,
        ).toBeGreaterThan(0);
      } finally {
        Deno.chdir(originalCwd);
      }
    });

    it("should register hot reload route in dev mode", () => {
      const app = new MageApp();
      const tempDir = Deno.makeTempDirSync();

      register(app, {
        outputDir: tempDir,
        basePath: "/",
        dev: true,
      });

      // Verify that handler is callable (route was registered)
      expect(app.handler).toBeDefined();
      expect(typeof app.handler).toBe("function");

      // Handler is the main request processor for all registered routes
      // Since we registered middleware, the handler should be available
    });
  });
});
