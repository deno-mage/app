import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { generateRobotsTxt } from "../robots.ts";

describe("markdown-app - robots", () => {
  describe("generateRobotsTxt", () => {
    it("should generate basic robots.txt", () => {
      const robots = generateRobotsTxt("https://example.com", "/");

      expect(robots).toContain("User-agent: *");
      expect(robots).toContain("Allow: /");
      expect(robots).toContain("Sitemap: https://example.com/sitemap.xml");
    });

    it("should handle basePath correctly", () => {
      const robots = generateRobotsTxt("https://example.com", "/docs");

      expect(robots).toContain(
        "Sitemap: https://example.com/docs/sitemap.xml",
      );
    });

    it("should normalize siteUrl by removing trailing slash", () => {
      const robots = generateRobotsTxt("https://example.com/", "/");

      expect(robots).toContain("Sitemap: https://example.com/sitemap.xml");
      expect(robots).not.toContain("https://example.com//");
    });

    it("should include proper formatting", () => {
      const robots = generateRobotsTxt("https://example.com", "/");

      // Check for proper sections
      expect(robots).toMatch(/# Allow all crawlers/);
      expect(robots).toMatch(/# Sitemap location/);

      // Check for proper line breaks
      const lines = robots.split("\n");
      expect(lines.length).toBeGreaterThan(4);
    });
  });
});
