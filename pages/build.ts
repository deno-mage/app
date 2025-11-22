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
import { processUnoCSS } from "./unocss.ts";

/**
 * Normalizes a base path to ensure it has a trailing slash.
 *
 * This ensures consistent URL building across the application.
 * Root path "/" is a special case that remains unchanged.
 *
 * @param basePath Base path to normalize
 * @returns Normalized base path with trailing slash
 */
function normalizeBasePath(basePath: string): string {
  if (basePath === "/") {
    return "/";
  }
  return basePath.endsWith("/") ? basePath : `${basePath}/`;
}

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
 * @param siteMetadata Site-wide metadata for sitemap and robots.txt
 * @param options Build configuration
 * @throws Error if file operations fail or rendering fails
 */
export async function build(
  siteMetadata: SiteMetadata,
  options: BuildOptions = {},
): Promise<void> {
  const rootDir = options.rootDir ?? "./";
  const outDir = options.outDir ?? join(rootDir, "dist");
  const basePath = normalizeBasePath(options.basePath ?? "/");

  const pagesDir = join(rootDir, "pages");
  const publicDir = join(rootDir, "public");

  logger.info(`Building static site from ${rootDir}...`);

  // Clean and recreate output directory for fresh build
  await Deno.remove(outDir, { recursive: true }).catch(() => {});
  await ensureDir(outDir);

  // Build asset map for cache-busting with configured base path
  const assetMap = await buildAssetMap(publicDir, basePath);

  // Scan for all markdown pages
  const pages = await scanPages(pagesDir);
  logger.info(`Found ${pages.length} pages to build`);

  // Create bundles directory
  const bundlesDir = join(outDir, "__bundles");
  await ensureDir(bundlesDir);

  // Generate UnoCSS styles if enabled
  const stylesheetUrl = await processUnoCSS(rootDir, outDir, basePath);

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

      // Render page with bundle URL (respecting base path)
      // Note: No SSR bundle needed in production - each page renders once,
      // so Deno's module cache doesn't cause issues with component updates
      const bundleUrl = `${basePath}__bundles/${bundle.filename}`;
      const rendered = await renderPageFromFile(
        page.filePath,
        rootDir,
        { assetMap, bundleUrl, stylesheetUrl },
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
      {
        assetMap,
        bundleUrl: `${basePath}__bundles/${notFoundBundle.filename}`,
        stylesheetUrl,
      },
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
      {
        assetMap,
        bundleUrl: `${basePath}__bundles/${errorBundle.filename}`,
        stylesheetUrl,
      },
    );
    await Deno.writeTextFile(join(outDir, "500.html"), rendered.html);
  } catch {
    // _error.md doesn't exist, skip
  }

  // Copy assets to dist/__public/ with hashed filenames
  await copyHashedAssets(publicDir, outDir, assetMap, basePath);

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
 * Uses directory-based URLs with index.html for clean URL structure.
 *
 * @param urlPath URL path to convert
 * @param outDir Output directory base path
 * @returns File path for HTML output
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
 *
 * @param publicDir Source directory for assets
 * @param outDir Destination directory for build output
 * @param assetMap Map of clean URLs to hashed URLs
 * @param basePath Base path for URL construction (used to strip prefix)
 * @throws Error if file copy operations fail
 */
async function copyHashedAssets(
  publicDir: string,
  outDir: string,
  assetMap: Map<string, string>,
  basePath: string,
): Promise<void> {
  for (const [cleanUrl, hashedUrl] of assetMap) {
    // Extract relative path from clean URL
    // "/public/styles.css" → "styles.css"
    const relativePath = cleanUrl.replace(/^\/public\//, "");

    // Extract hashed path from hashed URL by stripping basePath prefix
    // With basePath="/docs/": "/docs/__public/styles-abc123.css" → "styles-abc123.css"
    // With basePath="/": "/__public/styles-abc123.css" → "styles-abc123.css"
    const hashedPath = hashedUrl.replace(`${basePath}__public/`, "");

    const sourcePath = join(publicDir, relativePath);
    const destPath = join(outDir, "__public", hashedPath);

    // Ensure destination directory exists
    await ensureDir(join(destPath, ".."));

    // Copy the file
    await Deno.copyFile(sourcePath, destPath);
  }
}

/**
 * Generates a sitemap.xml file for search engine indexing.
 *
 * Creates XML sitemap with all page URLs and weekly change frequency.
 *
 * @param pages Array of page information
 * @param siteMetadata Site metadata including baseUrl
 * @param outDir Output directory for sitemap.xml
 * @throws Error if file write fails
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
 * Generates a robots.txt file allowing all crawlers.
 *
 * Points to the sitemap for improved search engine discovery.
 *
 * @param siteMetadata Site metadata including baseUrl
 * @param outDir Output directory for robots.txt
 * @throws Error if file write fails
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
