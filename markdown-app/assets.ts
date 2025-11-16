import { walk } from "@std/fs";
import { basename, dirname, extname, join, resolve } from "@std/path";
import { logger } from "./logger.ts";
import { ASSETS_DIR_NAME } from "./constants.ts";

/**
 * Asset hash mapping from original path to hashed path.
 */
export interface AssetMap {
  [originalPath: string]: string;
}

/**
 * Hash file contents using SHA-256 and return first 8 characters.
 */
async function hashFileContents(filepath: string): Promise<string> {
  const fileContents = await Deno.readFile(filepath);
  const hashBuffer = await crypto.subtle.digest("SHA-256", fileContents);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return hashHex.substring(0, 8);
}

/**
 * Generate hashed filename: icon.svg → icon-a3f2b1c8.svg
 */
function generateHashedFilename(
  originalName: string,
  hash: string,
): string {
  const ext = extname(originalName);
  const name = basename(originalName, ext);
  return `${name}-${hash}${ext}`;
}

/**
 * Copy assets from assetsDir to outputDir with cache-busted filenames.
 * Returns mapping of original paths to hashed paths for template replacement.
 *
 * @param assetsDir - Source directory containing assets (e.g., "__assets")
 * @param outputDir - Destination directory for built files
 * @param basePath - Base path for URLs (e.g., "/" or "/docs")
 * @returns Asset mapping: original path → hashed URL path
 */
export async function copyAssetsWithHashing(
  assetsDir: string,
  outputDir: string,
  basePath: string,
): Promise<AssetMap> {
  const absoluteAssetsDir = resolve(assetsDir);
  const absoluteOutputDir = resolve(outputDir);
  const assetMap: AssetMap = {};

  // Check if assets directory exists
  try {
    const stat = await Deno.stat(absoluteAssetsDir);
    if (!stat.isDirectory) {
      logger.warn(`Assets path is not a directory: ${assetsDir}`);
      return assetMap;
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      logger.info(`No assets directory found at ${assetsDir}, skipping`);
      return assetMap;
    }
    throw error;
  }

  logger.info(`Copying assets from ${assetsDir}...`);

  // Walk all files in assets directory
  let copiedCount = 0;
  for await (const entry of walk(absoluteAssetsDir)) {
    if (!entry.isFile) {
      continue;
    }

    // Get relative path from assets directory
    const relativePath = entry.path.substring(absoluteAssetsDir.length + 1);

    // Hash file contents
    const hash = await hashFileContents(entry.path);

    // Generate hashed filename
    const originalFilename = basename(entry.path);
    const hashedFilename = generateHashedFilename(originalFilename, hash);

    // Preserve directory structure in output under __assets/
    const relativeDir = dirname(relativePath);
    const outputSubDir = relativeDir === "."
      ? join(absoluteOutputDir, ASSETS_DIR_NAME)
      : join(absoluteOutputDir, ASSETS_DIR_NAME, relativeDir);

    // Ensure output subdirectory exists
    await Deno.mkdir(outputSubDir, { recursive: true });

    // Copy file with hashed name
    const outputPath = join(outputSubDir, hashedFilename);
    await Deno.copyFile(entry.path, outputPath);

    // Build URL path for template replacement (always includes __assets)
    const normalizedBasePath = basePath === "/" ? "" : basePath;
    const urlPath = relativeDir === "."
      ? `${normalizedBasePath}/__assets/${hashedFilename}`
      : `${normalizedBasePath}/__assets/${relativeDir}/${hashedFilename}`;

    // Map original path to hashed URL path
    assetMap[relativePath] = urlPath;

    copiedCount++;
  }

  logger.info(`Copied ${copiedCount} assets with cache busting`);

  return assetMap;
}

/**
 * Replace {{assets}}/path patterns in content with cache-busted URLs.
 *
 * Note: This regex matches alphanumeric characters, hyphens, underscores, dots, and forward slashes.
 * Query strings (e.g., ?v=1) and fragments (e.g., #section) are NOT supported.
 * Use assets as-is without query parameters.
 *
 * @param content - Markdown or HTML content
 * @param assetMap - Mapping of original asset paths to hashed URLs
 * @returns Content with {{assets}} replaced with actual hashed paths
 */
export function replaceAssetPlaceholders(
  content: string,
  assetMap: AssetMap,
): string {
  // Match {{assets}}/path where path contains: a-z A-Z 0-9 - _ . /
  // Does NOT match query strings (?foo=bar) or fragments (#section)
  return content.replace(
    /\{\{assets\}\}\/([\w\-./]+)/g,
    (_match, assetPath) => {
      const hashedPath = assetMap[assetPath];
      if (hashedPath === undefined) {
        // Asset not found, log warning and leave placeholder
        logger.warn(`Asset not found: ${assetPath}`);
        return `{{assets}}/${assetPath}`;
      }
      return hashedPath;
    },
  );
}
