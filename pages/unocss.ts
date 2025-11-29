/**
 * UnoCSS integration for the pages module.
 *
 * Provides zero-config CSS utility generation by scanning source files
 * and generating CSS on-demand using UnoCSS.
 *
 * @module
 */

import { createGenerator } from "@unocss/core";
import type { UnoGenerator, UserConfig } from "@unocss/core";
import { expandGlob } from "@std/fs";
import { join, toFileUrl } from "@std/path";
import { crypto } from "@std/crypto/crypto";
import { encodeHex } from "@std/encoding";
import { logger } from "./logger.ts";

/**
 * Result of generating UnoCSS styles.
 */
export interface UnoResult {
  /** Generated CSS content */
  css: string;
  /** Hashed filename for the CSS file */
  filename: string;
  /** Full URL path for the stylesheet */
  url: string;
}

/**
 * Checks if uno.config.ts exists in the root directory.
 *
 * @param rootDir Root directory to check
 * @returns True if uno.config.ts exists
 */
export async function checkUnoConfigExists(
  rootDir: string,
): Promise<boolean> {
  try {
    const configPath = join(rootDir, "uno.config.ts");
    await Deno.stat(configPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads user's uno.config.ts configuration file.
 *
 * Dynamically imports the config and returns the default export.
 *
 * @param rootDir Root directory containing uno.config.ts
 * @returns User configuration object
 * @throws Error if config file cannot be loaded
 */
export async function loadUnoConfig(
  rootDir: string,
): Promise<UserConfig> {
  const configPath = join(rootDir, "uno.config.ts");

  try {
    // Convert to absolute path, then to file URL
    const absolutePath = Deno.realPathSync(configPath);
    const configUrl = toFileUrl(absolutePath);

    // Add cache-busting query to force reload
    const cacheBustedUrl = `${configUrl.href}?t=${Date.now()}`;

    const module = await import(cacheBustedUrl);
    return module.default || {};
  } catch (error) {
    throw new Error(
      `Failed to load uno.config.ts: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Scans source files for UnoCSS class usage.
 *
 * Recursively scans from root directory for all relevant source files:
 * .ts, .tsx, .js, .jsx, .md, .mdx, .html
 *
 * Automatically excludes the output directory (dist by default) and node_modules.
 *
 * @param rootDir Root directory to scan from
 * @param outDir Output directory to exclude from scanning (default: "dist")
 * @returns Combined content of all source files
 */
export async function scanSourceFiles(
  rootDir: string,
  outDir = "dist",
): Promise<string> {
  const contents: string[] = [];

  // Resolve absolute paths for exclusion
  const absoluteOutDir = join(rootDir, outDir);

  try {
    // Scan for all relevant source files from root
    for await (
      const entry of expandGlob("**/*.{ts,tsx,js,jsx,md,mdx,html}", {
        root: rootDir,
        extended: true,
        globstar: true,
      })
    ) {
      // Skip if file is in output directory or node_modules
      if (
        entry.path.startsWith(absoluteOutDir) ||
        entry.path.includes("/node_modules/")
      ) {
        continue;
      }

      if (entry.isFile) {
        const content = await Deno.readTextFile(entry.path);
        contents.push(content);
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to scan source files: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return contents.join("\n\n");
}

/**
 * Generates CSS from source content using UnoCSS.
 *
 * Creates a UnoCSS generator with the user's config. No default presets
 * are provided - users must configure their own presets in uno.config.ts.
 *
 * @param content Source content to scan for utility classes
 * @param userConfig Optional user configuration from uno.config.ts
 * @param basePath Base path for URL construction
 * @returns Generated CSS with filename and URL
 */
export async function generateCSS(
  content: string,
  userConfig: UserConfig | undefined,
  basePath: string,
): Promise<UnoResult> {
  // Create generator with user config merged with defaults
  const generator: UnoGenerator = await createGenerator({
    ...userConfig,
  });

  // Generate CSS from content
  const result = await generator.generate(content);

  // Generate content hash for filename
  const hashBytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(result.css),
  );
  const hash = encodeHex(hashBytes).slice(0, 8);
  const filename = `uno-${hash}.css`;

  // Construct URL with base path
  const url = `${basePath}__styles/${filename}`;

  return {
    css: result.css,
    filename,
    url,
  };
}

/**
 * Writes generated CSS to the output directory.
 *
 * Creates the __styles/ directory if it doesn't exist and writes
 * the CSS file with the hashed filename.
 *
 * @param outDir Output directory (usually dist/)
 * @param filename Hashed filename for the CSS
 * @param css CSS content to write
 * @throws Error if file write fails
 */
export async function writeCSS(
  outDir: string,
  filename: string,
  css: string,
): Promise<void> {
  const stylesDir = join(outDir, "__styles");

  // Create __styles directory
  try {
    await Deno.mkdir(stylesDir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  // Write CSS file
  const cssPath = join(stylesDir, filename);
  await Deno.writeTextFile(cssPath, css);
}

/**
 * Complete UnoCSS pipeline: scan, generate, and write CSS.
 *
 * Checks for uno.config.ts, scans source files, generates CSS,
 * and writes to disk. Returns the stylesheet URL for injection
 * into HTML, or undefined if UnoCSS is not enabled.
 *
 * @param rootDir Root directory containing source files and config
 * @param outDir Output directory for generated CSS
 * @param basePath Base path for URL construction
 * @returns Stylesheet URL or undefined if disabled
 */
export async function processUnoCSS(
  rootDir: string,
  outDir: string,
  basePath: string,
): Promise<string | undefined> {
  // Check if UnoCSS is enabled
  const configExists = await checkUnoConfigExists(rootDir);
  if (!configExists) {
    return undefined;
  }

  logger.info("UnoCSS enabled");

  // Load user config
  let userConfig: UserConfig | undefined;
  try {
    userConfig = await loadUnoConfig(rootDir);
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return undefined;
  }

  // Scan source files (excluding outDir)
  const content = await scanSourceFiles(rootDir, outDir);

  // Generate CSS
  const result = await generateCSS(content, userConfig, basePath);

  // Write to disk
  await writeCSS(outDir, result.filename, result.css);

  return result.url;
}
