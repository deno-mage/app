/**
 * Static site build utilities.
 *
 * @module
 */

import { ensureDir } from "@std/fs";
import { join } from "@std/path";
import { scanPages } from "./scanner.ts";
import type { PageInfo } from "./scanner.ts";
import { renderPageFromFile } from "./renderer.ts";
import { buildAssetMap } from "./assets.ts";
import type { BuildOptions, SiteMetadata } from "./types.ts";

/**
 * Builds a static site from markdown files.
 *
 * Process:
 * 1. Scans pages/ directory for markdown files
 * 2. Builds asset map from public/ directory
 * 3. Renders each page with layout and asset URL replacement
 * 4. Writes HTML files to outDir
 * 5. Copies assets to outDir/__public/ with hashed filenames
 *
 * @param siteMetadata Site-wide metadata
 * @param options Build configuration
 */
export async function build(
  siteMetadata: SiteMetadata,
  options: BuildOptions = {},
): Promise<void> {
  const rootDir = options.rootDir ?? "./";
  const outDir = options.outDir ?? join(rootDir, "dist");

  const pagesDir = join(rootDir, "pages");
  const publicDir = join(rootDir, "public");

  // Ensure output directory exists
  await ensureDir(outDir);

  // Build asset map for cache-busting
  const assetMap = await buildAssetMap(publicDir);

  // Scan for all markdown pages
  const pages = await scanPages(pagesDir);

  // Render and write each page
  for (const page of pages) {
    const rendered = await renderPageFromFile(
      page.filePath,
      rootDir,
      assetMap,
    );

    // Determine output file path
    const outputPath = urlPathToFilePath(page.urlPath, outDir);

    // Ensure directory exists
    await ensureDir(join(outDir, ...outputPath.split("/").slice(0, -1)));

    // Write HTML file
    await Deno.writeTextFile(outputPath, rendered.html);
  }

  // Copy assets to dist/__public/ with hashed filenames
  await copyHashedAssets(publicDir, outDir, assetMap);

  // Generate sitemap.xml
  await generateSitemap(pages, siteMetadata, outDir);

  // Generate robots.txt
  await generateRobotsTxt(siteMetadata, outDir);
}

/**
 * Converts a URL path to an output file path.
 *
 * - `/` → `dist/index.html`
 * - `/docs/api` → `dist/docs/api/index.html`
 * - `/guide/intro` → `dist/guide/intro/index.html`
 */
function urlPathToFilePath(urlPath: string, outDir: string): string {
  if (urlPath === "/") {
    return join(outDir, "index.html");
  }

  return join(outDir, urlPath, "index.html");
}

/**
 * Copies assets from public/ to dist/__public/ with hashed filenames.
 *
 * Uses the asset map to determine hashed filenames and copies each file
 * to the correct location in the output directory.
 */
async function copyHashedAssets(
  publicDir: string,
  outDir: string,
  assetMap: Map<string, string>,
): Promise<void> {
  for (const [cleanUrl, hashedUrl] of assetMap) {
    // Extract relative path from clean URL
    // "/public/styles.css" → "styles.css"
    const relativePath = cleanUrl.replace(/^\/public\//, "");

    // Extract hashed path from hashed URL
    // "/__public/styles-abc123.css" → "styles-abc123.css"
    const hashedPath = hashedUrl.replace(/^\/__public\//, "");

    const sourcePath = join(publicDir, relativePath);
    const destPath = join(outDir, "__public", hashedPath);

    // Ensure destination directory exists
    await ensureDir(join(destPath, ".."));

    // Copy the file
    await Deno.copyFile(sourcePath, destPath);
  }
}

/**
 * Generates a sitemap.xml file.
 *
 * Creates XML sitemap with all page URLs for search engine indexing.
 */
async function generateSitemap(
  pages: PageInfo[],
  siteMetadata: SiteMetadata,
  outDir: string,
): Promise<void> {
  const urls = pages.map((page) => {
    const url = `${siteMetadata.baseUrl}${page.urlPath}`;
    return `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
  </url>`;
  }).join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  await Deno.writeTextFile(join(outDir, "sitemap.xml"), sitemap);
}

/**
 * Generates a robots.txt file.
 *
 * Allows all crawlers and points to the sitemap.
 */
async function generateRobotsTxt(
  siteMetadata: SiteMetadata,
  outDir: string,
): Promise<void> {
  const robots = `User-agent: *
Allow: /

Sitemap: ${siteMetadata.baseUrl}/sitemap.xml
`;

  await Deno.writeTextFile(join(outDir, "robots.txt"), robots);
}
