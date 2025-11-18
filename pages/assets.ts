/**
 * Asset management utilities for cache-busting.
 *
 * Handles hashing of static assets and URL replacement in rendered HTML.
 *
 * @module
 */

import { relative } from "@std/path";
import { walk } from "@std/fs";

/**
 * Computes a hash of file contents for cache-busting.
 *
 * Uses SHA-256 and returns first 8 characters of hex digest.
 */
async function hashFile(filePath: string): Promise<string> {
  const content = await Deno.readFile(filePath);
  const hashBuffer = await crypto.subtle.digest("SHA-256", content);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return hashHex.slice(0, 8);
}

/**
 * Builds a hashed filename with the hash inserted before the extension.
 *
 * "styles.css" + "abc123" → "styles-abc123.css"
 * "images/logo.png" + "def456" → "images/logo-def456.png"
 */
export function buildHashedFilename(filePath: string, hash: string): string {
  const lastDotIndex = filePath.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return `${filePath}-${hash}`;
  }
  const name = filePath.slice(0, lastDotIndex);
  const ext = filePath.slice(lastDotIndex);
  return `${name}-${hash}${ext}`;
}

/**
 * Scans a directory and builds a map of clean URLs to hashed URLs.
 *
 * Computes hash of each file's contents and maps:
 * `/public/path/file.ext` → `{baseRoute}__public/path/file-[hash].ext`
 */
export async function buildAssetMap(
  publicDir: string,
  baseRoute = "/",
): Promise<Map<string, string>> {
  const assetMap = new Map<string, string>();

  try {
    for await (const entry of walk(publicDir, { includeFiles: true })) {
      if (entry.isFile) {
        const hash = await hashFile(entry.path);
        const relativePath = relative(publicDir, entry.path);
        const hashedFilename = buildHashedFilename(relativePath, hash);

        // Clean URL: /public/path/file.ext
        const cleanUrl = `/public/${relativePath}`;

        // Hashed URL: {baseRoute}__public/path/file-hash.ext
        const hashedUrl = `${baseRoute}__public/${hashedFilename}`;

        assetMap.set(cleanUrl, hashedUrl);
      }
    }
  } catch (error) {
    // If directory doesn't exist, return empty map
    if (error instanceof Deno.errors.NotFound) {
      return assetMap;
    }
    throw error;
  }

  return assetMap;
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replaces all asset URLs in HTML with their hashed versions.
 *
 * Finds `/public/*` URLs in quotes, parentheses, and equals signs,
 * replacing with `/__public/*-[hash].*` from the asset map.
 */
export function replaceAssetUrls(
  html: string,
  assetMap: Map<string, string>,
): string {
  let result = html;

  for (const [cleanUrl, hashedUrl] of assetMap) {
    // Match the URL when preceded by a quote, parenthesis, or equals sign
    // This catches: src="/public/...", href='/public/...', url(/public/...)
    const pattern = new RegExp(
      `(['"\(=])${escapeRegex(cleanUrl)}`,
      "g",
    );
    result = result.replace(pattern, `$1${hashedUrl}`);
  }

  return result;
}

/**
 * Reverses a hashed URL back to its clean file path.
 *
 * Maps incoming requests `{baseRoute}__public/file-hash.ext` → `file.ext`
 * for serving original files in dev mode.
 *
 * @returns Clean file path relative to public/ dir, or null if not found
 */
export function resolveAssetPath(
  hashedUrl: string,
  assetMap: Map<string, string>,
): string | null {
  for (const [cleanUrl, hashedUrlMapped] of assetMap) {
    if (hashedUrlMapped === hashedUrl) {
      // Remove /public/ prefix to get relative path
      return cleanUrl.replace(/^\/public\//, "");
    }
  }
  return null;
}
