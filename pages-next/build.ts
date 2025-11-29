/**
 * Static site build utilities.
 *
 * @module
 */

import { ensureDir } from "@std/fs";
import { dirname, join, relative, resolve } from "@std/path";
import { buildAssetMap, replaceAssetUrls } from "./assets.ts";
import { buildBundle, stopBundleBuilder } from "./bundle-builder.ts";
import { escapeXml } from "./html-utils.ts";
import { logger } from "./logger.ts";
import { renderPage } from "./renderer.tsx";
import { getLayoutsForPage, scanPages, scanSystemFiles } from "./scanner.ts";
import type {
  BuildOptions,
  PageInfo,
  SiteMetadata,
  SystemFiles,
} from "./types.ts";
import { processUnoCSS } from "./unocss.ts";

/**
 * Normalizes a base path to ensure it has a trailing slash.
 *
 * Root path "/" is a special case that remains unchanged.
 * Validates that basePath starts with "/" and contains only safe characters.
 *
 * @param basePath Base path to normalize
 * @returns Normalized base path with trailing slash
 * @throws Error if basePath is invalid
 */
function normalizeBasePath(basePath: string): string {
  // Validate basePath format: must start with / and contain only safe URL characters
  if (!/^\/[\w\-./]*$/.test(basePath)) {
    throw new Error(
      `Invalid basePath "${basePath}": must start with "/" and contain only alphanumeric characters, hyphens, underscores, dots, and slashes`,
    );
  }

  // Reject path traversal attempts
  if (basePath.includes("..")) {
    throw new Error(
      `Invalid basePath "${basePath}": path traversal not allowed`,
    );
  }

  if (basePath === "/") {
    return "/";
  }
  return basePath.endsWith("/") ? basePath : `${basePath}/`;
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
 * Gets the directory containing a page from its relative file path.
 *
 * @param relativePath Relative path from pages directory
 * @returns Directory path (empty string for root-level pages)
 */
function getPageDir(relativePath: string): string {
  const dir = dirname(relativePath);
  return dir === "." ? "" : dir;
}

/**
 * Generates a page ID from a URL path for bundle naming.
 *
 * @param urlPath URL path for the page
 * @returns Page ID suitable for filename
 */
function urlPathToPageId(urlPath: string): string {
  if (urlPath === "/") {
    return "index";
  }
  return urlPath.slice(1).replace(/\//g, "-");
}

/**
 * Copies assets from public/ to dist/__public/ with hashed filenames.
 *
 * @param publicDir Source directory for assets
 * @param outDir Destination directory for build output
 * @param assetMap Map of clean URLs to hashed URLs
 * @param basePath Base path for URL construction
 */
async function copyHashedAssets(
  publicDir: string,
  outDir: string,
  assetMap: Map<string, string>,
  basePath: string,
): Promise<void> {
  const resolvedPublicDir = resolve(publicDir);
  const resolvedOutDir = resolve(outDir, "__public");

  for (const [cleanUrl, hashedUrl] of assetMap) {
    // Extract relative path from clean URL
    // "/public/styles.css" → "styles.css"
    const relativePath = cleanUrl.replace(/^\/public\//, "");

    // Extract hashed path from hashed URL by stripping basePath prefix
    const hashedPath = hashedUrl.replace(`${basePath}__public/`, "");

    const sourcePath = resolve(publicDir, relativePath);
    const destPath = resolve(outDir, "__public", hashedPath);

    // Path traversal protection
    if (
      !sourcePath.startsWith(resolvedPublicDir + "/") &&
      sourcePath !== resolvedPublicDir
    ) {
      throw new Error(`Invalid source path: ${relativePath}`);
    }
    if (
      !destPath.startsWith(resolvedOutDir + "/") &&
      destPath !== resolvedOutDir
    ) {
      throw new Error(`Invalid destination path: ${hashedPath}`);
    }

    // Ensure destination directory exists
    await ensureDir(dirname(destPath));

    // Copy the file
    await Deno.copyFile(sourcePath, destPath);
  }
}

/**
 * Generates a sitemap.xml file for search engine indexing.
 *
 * @param pages Array of page information
 * @param siteMetadata Site metadata including baseUrl
 * @param outDir Output directory for sitemap.xml
 */
async function generateSitemap(
  pages: PageInfo[],
  siteMetadata: SiteMetadata,
  outDir: string,
): Promise<void> {
  const urls = pages.map((page) => {
    const url = escapeXml(`${siteMetadata.baseUrl}${page.urlPath}`);
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
 * @param siteMetadata Site metadata including baseUrl
 * @param outDir Output directory for robots.txt
 */
async function generateRobotsTxt(
  siteMetadata: SiteMetadata,
  outDir: string,
): Promise<void> {
  const sitemapUrl = escapeXml(`${siteMetadata.baseUrl}/sitemap.xml`);
  const robots = `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;

  await Deno.writeTextFile(join(outDir, "robots.txt"), robots);
}

/**
 * Renders a special page (404 or 500) if it exists.
 *
 * @param filePath Path to the special page file
 * @param outputName Output filename (e.g., "404.html")
 * @param pagesDir Pages directory
 * @param outDir Output directory
 * @param bundlesDir Bundles directory
 * @param systemFiles System files
 * @param assetMap Asset map for URL replacement
 * @param basePath Base path for URLs
 * @param rootDir Root directory for bundle resolution
 * @param stylesheetUrl Optional stylesheet URL for UnoCSS
 */
async function renderSpecialPage(
  filePath: string | undefined,
  outputName: string,
  pagesDir: string,
  outDir: string,
  bundlesDir: string,
  systemFiles: SystemFiles,
  assetMap: Map<string, string>,
  basePath: string,
  rootDir: string,
  stylesheetUrl?: string,
): Promise<void> {
  if (!filePath) {
    return;
  }

  try {
    const pageId = outputName.replace(".html", "");

    // Get layouts for the special page (it's at root level)
    const layoutInfos = getLayoutsForPage("", systemFiles.layouts);
    const layoutPaths = layoutInfos.map((l) => l.filePath);

    // Build client bundle for TSX pages (special pages are always TSX)
    const bundle = await buildBundle({
      pagePath: filePath,
      layoutPaths,
      rootDir,
      production: true,
      pageId,
    });

    // Write bundle
    const bundlePath = join(bundlesDir, bundle.filename!);
    await Deno.writeTextFile(bundlePath, bundle.code);

    // Render page
    const bundleUrl = `${basePath}__bundles/${bundle.filename}`;
    const result = await renderPage({
      pagePath: filePath,
      pagesDir,
      systemFiles,
      bundleUrl,
      stylesheetUrl,
    });

    // Replace asset URLs and write
    const finalHtml = replaceAssetUrls(result.html, assetMap);
    await Deno.writeTextFile(join(outDir, outputName), finalHtml);
  } catch (error) {
    // Log rendering failures but don't fail the build (special pages are optional)
    logger.warn(
      `Failed to render ${outputName}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Builds a static site from pages.
 *
 * Process:
 * 1. Cleans output directory
 * 2. Scans pages/ directory for pages and system files
 * 3. Builds asset map from public/ directory
 * 4. For each TSX page: builds bundle and renders HTML
 * 5. For each Markdown page: renders HTML (no hydration)
 * 6. Copies assets with hashed filenames
 * 7. Generates sitemap.xml and robots.txt
 *
 * @param siteMetadata Site-wide metadata for sitemap and robots.txt
 * @param options Build configuration
 */
export async function build(
  siteMetadata: SiteMetadata,
  options: BuildOptions = {},
): Promise<void> {
  const startTime = performance.now();

  const rootDir = options.rootDir ?? "./";
  const outDir = options.outDir ?? join(rootDir, "dist");
  const basePath = normalizeBasePath(options.basePath ?? "/");

  const pagesDir = resolve(rootDir, "pages");
  const publicDir = resolve(rootDir, "public");

  // Clean and recreate output directory
  try {
    await Deno.remove(outDir, { recursive: true });
  } catch (error) {
    // NotFound is fine - directory doesn't exist yet
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
  await ensureDir(outDir);

  // Scan for system files and pages
  const systemFiles = await scanSystemFiles(pagesDir);
  const pages = await scanPages(pagesDir);

  // Build asset map for cache-busting
  const assetMap = await buildAssetMap(publicDir, basePath);

  // Process UnoCSS (if uno.config.ts exists)
  const stylesheetUrl = await processUnoCSS(rootDir, outDir, basePath);

  // Create bundles directory
  const bundlesDir = join(outDir, "__bundles");
  await ensureDir(bundlesDir);

  // Render and write each page
  // Build all pages in parallel
  const pageResults = await Promise.allSettled(
    pages.map(async (page) => {
      const pageId = urlPathToPageId(page.urlPath);
      const relativePath = relative(pagesDir, page.filePath);
      const pageDir = getPageDir(relativePath);

      // Get layouts for this page
      const layoutInfos = getLayoutsForPage(pageDir, systemFiles.layouts);
      const layoutPaths = layoutInfos.map((l) => l.filePath);

      // Build client bundle for hydration (both TSX and markdown pages)
      const bundle = await buildBundle({
        pagePath: page.filePath,
        layoutPaths,
        rootDir: Deno.cwd(),
        production: true,
        pageId,
        isMarkdown: page.type === "markdown",
      });

      // Write bundle to disk
      const bundlePath = join(bundlesDir, bundle.filename!);
      await Deno.writeTextFile(bundlePath, bundle.code);

      const bundleUrl = `${basePath}__bundles/${bundle.filename}`;

      // Render page
      const result = await renderPage({
        pagePath: page.filePath,
        pagesDir,
        systemFiles,
        markdownOptions: options.markdownOptions,
        bundleUrl,
        stylesheetUrl,
      });

      // Replace asset URLs
      const finalHtml = replaceAssetUrls(result.html, assetMap);

      // Determine output path and write
      const outputPath = urlPathToFilePath(page.urlPath, outDir);
      await ensureDir(dirname(outputPath));
      await Deno.writeTextFile(outputPath, finalHtml);

      return page.urlPath;
    }),
  );

  // Count successes and log errors
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < pageResults.length; i++) {
    const result = pageResults[i];
    if (result.status === "fulfilled") {
      successCount++;
    } else {
      errorCount++;
      const page = pages[i];
      logger.error(
        `Failed to render ${page.urlPath}: ${
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason)
        }`,
      );
    }
  }

  // Render special pages (_not-found and _error)
  await renderSpecialPage(
    systemFiles.notFound,
    "_not-found.html",
    pagesDir,
    outDir,
    bundlesDir,
    systemFiles,
    assetMap,
    basePath,
    rootDir,
    stylesheetUrl,
  );

  await renderSpecialPage(
    systemFiles.error,
    "_error.html",
    pagesDir,
    outDir,
    bundlesDir,
    systemFiles,
    assetMap,
    basePath,
    rootDir,
    stylesheetUrl,
  );

  // Copy hashed assets
  await copyHashedAssets(publicDir, outDir, assetMap, basePath);

  // Generate sitemap and robots.txt
  await generateSitemap(pages, siteMetadata, outDir);
  await generateRobotsTxt(siteMetadata, outDir);

  // Clean up esbuild
  await stopBundleBuilder();

  // Log summary
  const endTime = performance.now();
  const buildTime = Math.round(endTime - startTime);

  if (errorCount > 0) {
    logger.error(`Build failed with ${errorCount} error(s)`);
  } else {
    logger.success(`Built ${successCount} pages (${buildTime}ms)`);
  }
}
