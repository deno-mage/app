/**
 * Static site build utilities.
 *
 * @module
 */

import { ensureDir } from "@std/fs";
import { join, resolve } from "@std/path";
import { scanPages } from "./scanner.ts";
import type { PageInfo } from "./scanner.ts";
import { renderPageFromFile } from "./renderer.ts";
import { buildAssetMap } from "./assets.ts";
import { buildBundle, stopBundleBuilder } from "./bundle-builder.ts";
import { logger } from "./logger.ts";
import type { BuildOptions, SiteMetadata } from "./types.ts";
import { extractLayoutName } from "./frontmatter-parser.ts";

/**
 * Builds a static site from markdown files.
 *
 * Process:
 * 1. Cleans output directory (removes all existing files)
 * 2. Scans pages/ directory for markdown files
 * 3. Builds asset map from public/ directory
 * 4. Renders each page with layout and asset URL replacement
 * 5. Writes HTML files to outDir
 * 6. Copies assets to outDir/__public/ with hashed filenames
 *
 * Note: The output directory is completely cleaned before each build
 * to ensure no stale files remain from previous builds.
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
  const baseUrl = options.baseUrl ?? "/";

  const pagesDir = join(rootDir, "pages");
  const publicDir = join(rootDir, "public");

  logger.info(`Building static site from ${rootDir}...`);

  // Clean and recreate output directory for fresh build
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
  await ensureDir(outDir);

  // Build asset map for cache-busting with configured base URL
  const assetMap = await buildAssetMap(publicDir, baseUrl);

  // Scan for all markdown pages
  const pages = await scanPages(pagesDir);
  logger.info(`Found ${pages.length} pages to build`);

  // Create bundles directory
  const bundlesDir = join(outDir, "__bundles");
  await ensureDir(bundlesDir);

  // Render and write each page
  let successCount = 0;
  let errorCount = 0;

  for (const page of pages) {
    try {
      // Read frontmatter to determine layout
      const content = await Deno.readTextFile(page.filePath);
      const layoutName = extractLayoutName(content);

      // Build client bundle for this page
      // Use resolve() to ensure absolute path for esbuild
      const layoutPath = resolve(rootDir, "layouts", `${layoutName}.tsx`);
      const pageId = page.urlPath === "/"
        ? "index"
        : page.urlPath.slice(1).replace(/\//g, "-");

      const bundle = await buildBundle({
        layoutPath,
        rootDir: Deno.cwd(), // Use project root where deno.json is for import resolution
        production: true,
        pageId,
      });

      // Write bundle to disk
      const bundlePath = join(bundlesDir, bundle.filename!);
      await Deno.writeTextFile(bundlePath, bundle.code);

      // Render page with bundle URL (respecting base URL)
      const bundleUrl = `${baseUrl}__bundles/${bundle.filename}`;
      const rendered = await renderPageFromFile(
        page.filePath,
        rootDir,
        { assetMap, bundleUrl },
      );

      // Determine output file path
      const outputPath = urlPathToFilePath(page.urlPath, outDir);

      // Ensure parent directory exists
      const parentDir = join(outputPath, "..");
      await ensureDir(parentDir);

      // Write HTML file
      await Deno.writeTextFile(outputPath, rendered.html);
      successCount++;
    } catch (error) {
      errorCount++;
      logger.error(
        new Error(
          `Failed to render ${page.urlPath}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
    }
  }

  // Render _not-found.md to 404.html (if it exists)
  const notFoundPath = join(pagesDir, "_not-found.md");
  try {
    const content = await Deno.readTextFile(notFoundPath);
    const layoutName = extractLayoutName(content);
    const layoutPath = resolve(rootDir, "layouts", `${layoutName}.tsx`);

    const notFoundBundle = await buildBundle({
      layoutPath,
      rootDir: Deno.cwd(),
      production: true,
      pageId: "404",
    });

    const notFoundBundlePath = join(bundlesDir, notFoundBundle.filename!);
    await Deno.writeTextFile(notFoundBundlePath, notFoundBundle.code);

    const rendered = await renderPageFromFile(
      notFoundPath,
      rootDir,
      { assetMap, bundleUrl: `${baseUrl}__bundles/${notFoundBundle.filename}` },
    );
    await Deno.writeTextFile(join(outDir, "404.html"), rendered.html);
  } catch {
    // _not-found.md doesn't exist, skip
  }

  // Render _error.md to 500.html (if it exists)
  const errorPath = join(pagesDir, "_error.md");
  try {
    const content = await Deno.readTextFile(errorPath);
    const layoutName = extractLayoutName(content);
    const layoutPath = resolve(rootDir, "layouts", `${layoutName}.tsx`);

    const errorBundle = await buildBundle({
      layoutPath,
      rootDir: Deno.cwd(),
      production: true,
      pageId: "500",
    });

    const errorBundlePath = join(bundlesDir, errorBundle.filename!);
    await Deno.writeTextFile(errorBundlePath, errorBundle.code);

    const rendered = await renderPageFromFile(
      errorPath,
      rootDir,
      { assetMap, bundleUrl: `${baseUrl}__bundles/${errorBundle.filename}` },
    );
    await Deno.writeTextFile(join(outDir, "500.html"), rendered.html);
  } catch {
    // _error.md doesn't exist, skip
  }

  // Copy assets to dist/__public/ with hashed filenames
  await copyHashedAssets(publicDir, outDir, assetMap);

  // Generate sitemap.xml
  await generateSitemap(pages, siteMetadata, outDir);

  // Generate robots.txt
  await generateRobotsTxt(siteMetadata, outDir);

  // Clean up esbuild
  stopBundleBuilder();

  // Log summary
  if (errorCount > 0) {
    logger.error(new Error(`Build completed with ${errorCount} error(s)`));
  }
  logger.info(`✓ Built ${successCount} pages to ${outDir}`);
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
