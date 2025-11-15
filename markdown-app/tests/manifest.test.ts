import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { generateManifest } from "../manifest.ts";
import type { SiteMetadata } from "../builder.ts";

describe("markdown-app - manifest", () => {
  describe("generateManifest", () => {
    it("should generate basic manifest", () => {
      const siteMetadata: SiteMetadata = {
        siteUrl: "https://example.com",
        siteName: "My Docs",
        description: "Documentation site",
      };

      const manifest = generateManifest(siteMetadata, "/");
      const parsed = JSON.parse(manifest);

      expect(parsed.name).toBe("My Docs");
      expect(parsed.short_name).toBe("My Docs");
      expect(parsed.description).toBe("Documentation site");
      expect(parsed.start_url).toBe("/");
      expect(parsed.display).toBe("standalone");
    });

    it("should use default values when optional fields not provided", () => {
      const siteMetadata: SiteMetadata = {
        siteUrl: "https://example.com",
      };

      const manifest = generateManifest(siteMetadata, "/");
      const parsed = JSON.parse(manifest);

      expect(parsed.name).toBe("Documentation");
      expect(parsed.short_name).toBe("Docs");
      expect(parsed.theme_color).toBe("#ffffff");
      expect(parsed.background_color).toBe("#ffffff");
    });

    it("should handle custom theme color", () => {
      const siteMetadata: SiteMetadata = {
        siteUrl: "https://example.com",
        themeColor: "#1e40af",
      };

      const manifest = generateManifest(siteMetadata, "/");
      const parsed = JSON.parse(manifest);

      expect(parsed.theme_color).toBe("#1e40af");
      expect(parsed.background_color).toBe("#1e40af");
    });

    it("should handle basePath correctly", () => {
      const siteMetadata: SiteMetadata = {
        siteUrl: "https://example.com",
      };

      const manifest = generateManifest(siteMetadata, "/docs");
      const parsed = JSON.parse(manifest);

      expect(parsed.start_url).toBe("/docs/");
    });

    it("should include icons when provided", () => {
      const siteMetadata: SiteMetadata = {
        siteUrl: "https://example.com",
        icon192Path: "icon-192.png",
        icon512Path: "icon-512.png",
        icon512MaskablePath: "icon-512-maskable.png",
      };

      const manifest = generateManifest(siteMetadata, "/");
      const parsed = JSON.parse(manifest);

      expect(parsed.icons).toBeDefined();
      expect(parsed.icons.length).toBe(3);

      expect(parsed.icons[0]).toEqual({
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      });

      expect(parsed.icons[1]).toEqual({
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      });

      expect(parsed.icons[2]).toEqual({
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      });
    });

    it("should handle icons with basePath", () => {
      const siteMetadata: SiteMetadata = {
        siteUrl: "https://example.com",
        icon192Path: "icon-192.png",
      };

      const manifest = generateManifest(siteMetadata, "/docs");
      const parsed = JSON.parse(manifest);

      expect(parsed.icons[0].src).toBe("/docs/icon-192.png");
    });

    it("should omit icons array when no icons provided", () => {
      const siteMetadata: SiteMetadata = {
        siteUrl: "https://example.com",
      };

      const manifest = generateManifest(siteMetadata, "/");
      const parsed = JSON.parse(manifest);

      expect(parsed.icons).toBeUndefined();
    });

    it("should include only provided icons", () => {
      const siteMetadata: SiteMetadata = {
        siteUrl: "https://example.com",
        icon192Path: "icon-192.png",
      };

      const manifest = generateManifest(siteMetadata, "/");
      const parsed = JSON.parse(manifest);

      expect(parsed.icons.length).toBe(1);
      expect(parsed.icons[0].sizes).toBe("192x192");
    });

    it("should generate valid JSON", () => {
      const siteMetadata: SiteMetadata = {
        siteUrl: "https://example.com",
        siteName: "Test Site",
      };

      const manifest = generateManifest(siteMetadata, "/");

      // Should not throw
      expect(() => JSON.parse(manifest)).not.toThrow();
    });
  });
});
