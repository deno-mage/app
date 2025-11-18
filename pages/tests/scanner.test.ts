import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { join } from "@std/path";
import { scanPages } from "../scanner.ts";

const FIXTURES_DIR = join(
  new URL(".", import.meta.url).pathname,
  "fixtures",
);

describe("scanner - page discovery", () => {
  it("should find all markdown files", async () => {
    const pagesDir = join(FIXTURES_DIR, "pages");
    const pages = await scanPages(pagesDir);

    expect(pages.length).toBeGreaterThanOrEqual(2);
  });

  it("should convert index.md to /", async () => {
    const pagesDir = join(FIXTURES_DIR, "pages");
    const pages = await scanPages(pagesDir);

    const indexPage = pages.find((p) => p.urlPath === "/");
    expect(indexPage).toBeDefined();
    expect(indexPage!.filePath).toContain("index.md");
  });

  it("should convert nested files to URL paths", async () => {
    const pagesDir = join(FIXTURES_DIR, "pages");
    const pages = await scanPages(pagesDir);

    const introPage = pages.find((p) => p.urlPath === "/docs/intro");
    expect(introPage).toBeDefined();
    expect(introPage!.filePath).toContain("docs/intro.md");
  });

  it("should return empty array for non-existent directory", async () => {
    const pagesDir = join(FIXTURES_DIR, "nonexistent");
    const pages = await scanPages(pagesDir);

    expect(pages).toEqual([]);
  });

  it("should only include .md files", async () => {
    const pagesDir = join(FIXTURES_DIR, "pages");
    const pages = await scanPages(pagesDir);

    for (const page of pages) {
      expect(page.filePath).toContain(".md");
    }
  });
});
