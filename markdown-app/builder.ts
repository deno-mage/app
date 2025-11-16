import { walk } from "@std/fs";
import { dirname, join, resolve } from "@std/path";
import { CSS as GFM_CSS } from "@deno/gfm";
import { type Frontmatter, parseMarkdown } from "./parser.ts";
import type { TemplateData } from "./template.ts";
import { generateNavigation, type NavigationData } from "./navigation.ts";
import { generateSitemap } from "./sitemap.ts";
import { generateRobotsTxt } from "./robots.ts";
import { generateManifest } from "./manifest.ts";
import {
  type AssetMap,
  copyAssetsWithHashing,
  replaceAssetPlaceholders,
} from "./assets.ts";
import { logger } from "./logger.ts";
import { renderJsxLayout } from "./jsx-renderer.ts";
import { LAYOUT_PREFIX, LAYOUT_SUFFIX } from "./constants.ts";

/**
 * Load Prism syntax highlighting language components dynamically in parallel.
 *
 * Fails silently if a language component cannot be loaded, logging a warning instead.
 * This ensures the build continues even if some language components are missing.
 *
 * @param languages Array of Prism language identifiers (e.g., ["typescript", "python"])
 */
async function loadSyntaxHighlightLanguages(
  languages: string[],
): Promise<void> {
  const PRISM_VERSION = "1.29.0";

  await Promise.all(
    languages.map((lang) =>
      import(`npm:prismjs@${PRISM_VERSION}/components/prism-${lang}.js`)
        .catch((error) => {
          logger.warn(
            `Failed to load syntax highlighting for language "${lang}": ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        })
    ),
  );
}

/**
 * Site metadata for production files (sitemap, manifest, etc.).
 */
export interface SiteMetadata {
  /** Full site URL (e.g., "https://example.com") - required for sitemap.xml */
  siteUrl: string;
  /** Site name for manifest.webmanifest */
  siteName?: string;
  /** Site description for manifest.webmanifest */
  description?: string;
  /** Theme color for manifest and mobile browsers */
  themeColor?: string;
  /** Path to favicon.ico (relative to outputDir), if not provided, won't be referenced */
  faviconPath?: string;
  /** Path to icon.svg (relative to outputDir) */
  iconSvgPath?: string;
  /** Path to apple-touch-icon.png (relative to outputDir) */
  appleTouchIconPath?: string;
  /** Path to 192x192 icon for PWA (relative to outputDir) */
  icon192Path?: string;
  /** Path to 512x512 icon for PWA (relative to outputDir) */
  icon512Path?: string;
  /** Path to 512x512 maskable icon for PWA (relative to outputDir) */
  icon512MaskablePath?: string;
}

/**
 * Options for building markdown files to static HTML.
 */
export interface BuildOptions {
  /** Directory containing layout templates (_layout-*.tsx files) */
  layoutDir: string;
  /** Directory containing markdown article files */
  articlesDir: string;
  /** Directory containing static assets to copy (with cache busting) @default "assets" */
  assetsDir?: string;
  /** Directory to write built HTML and static files */
  outputDir: string;
  /** Base URL path for the site (e.g., "/" or "/docs") */
  basePath: string;
  /** Enable development mode (injects hot reload script) */
  dev: boolean;
  /** Prism language components to load for syntax highlighting */
  syntaxHighlightLanguages: string[];
  /** Site metadata for production files (sitemap, robots.txt, manifest) */
  siteMetadata?: SiteMetadata;
}

/**
 * Build all markdown files from articlesDir to outputDir.
 */
export async function build(options: BuildOptions): Promise<void> {
  const {
    articlesDir,
    outputDir,
    layoutDir,
    basePath,
    dev,
    syntaxHighlightLanguages,
    siteMetadata,
    assetsDir = "assets",
  } = options;

  logger.info(`Building markdown files from ${articlesDir}...`);

  // Step 1: Load syntax highlighting languages
  await loadSyntaxHighlightLanguages(syntaxHighlightLanguages);

  // Step 2: Copy assets with cache busting
  const assetMap = await copyAssetsWithHashing(assetsDir, outputDir, basePath);

  // Step 3: Find all markdown files
  const markdownFiles = await findMarkdownFiles(articlesDir);
  logger.info(`Found ${markdownFiles.length} markdown files`);

  if (markdownFiles.length === 0) {
    logger.warn(`No markdown files found in ${articlesDir}`);
    return;
  }

  // Step 4: Parse all markdown files
  const pages = await parseAllFiles(markdownFiles, assetMap);
  logger.info(`Parsed ${pages.length} pages`);

  // Check for duplicate slugs
  const seenSlugs = new Map<string, string>();
  for (const page of pages) {
    const slug = page.frontmatter.slug;
    if (seenSlugs.has(slug)) {
      throw new Error(
        `Duplicate slug "${slug}" found.\n  First seen in: ${
          seenSlugs.get(slug)
        }\n  Duplicate in: ${page.filepath}\n\nEach page must have a unique slug.`,
      );
    }
    seenSlugs.set(slug, page.filepath);
  }

  // Step 5: Pre-compute navigation for all pages (avoids O(n²) complexity)
  const navigationBySlug = new Map<string, NavigationData>();
  const allFrontmatter = pages.map((p) => p.frontmatter);
  for (const page of pages) {
    navigationBySlug.set(
      page.frontmatter.slug,
      generateNavigation(allFrontmatter, page.frontmatter.slug, basePath),
    );
  }

  // Step 6: Build each page with pre-computed navigation
  for (const page of pages) {
    const navigation = navigationBySlug.get(page.frontmatter.slug)!;
    await buildPage(page, navigation, {
      outputDir,
      layoutDir,
      basePath,
      dev,
    });
  }

  // Step 7: Write GFM CSS
  await writeGfmCss(outputDir);

  // Step 8: Generate production files (sitemap, robots.txt, manifest) if siteMetadata provided
  if (siteMetadata) {
    await writeProductionFiles(
      pages.map((p) => p.frontmatter),
      siteMetadata,
      basePath,
      outputDir,
      assetMap,
    );
  }

  logger.success(`Build complete! Output: ${outputDir}`);
}

/**
 * Find all .md files in a directory recursively.
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const absoluteDir = resolve(dir);

  for await (const entry of walk(absoluteDir, { exts: [".md"] })) {
    if (entry.isFile) {
      files.push(entry.path);
    }
  }

  return files;
}

/**
 * Parsed page with file path.
 */
interface ParsedPage {
  filepath: string;
  frontmatter: Frontmatter;
  content: string;
}

/**
 * Parse all markdown files with asset placeholder replacement.
 */
async function parseAllFiles(
  files: string[],
  assetMap: AssetMap,
): Promise<ParsedPage[]> {
  const pages: ParsedPage[] = [];

  for (const filepath of files) {
    try {
      const fileContent = await Deno.readTextFile(filepath);

      // Replace {{assets}} placeholders in markdown before parsing
      const contentWithAssets = replaceAssetPlaceholders(fileContent, assetMap);

      const parsed = parseMarkdown(contentWithAssets, filepath);

      pages.push({
        filepath,
        frontmatter: parsed.frontmatter,
        content: parsed.content,
      });
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      const enrichedError = new Error(
        `Failed to parse ${filepath}: ${errorMessage}`,
      );
      logger.error(enrichedError);
      throw enrichedError;
    }
  }

  return pages;
}

/**
 * Build a single page to HTML.
 */
async function buildPage(
  page: ParsedPage,
  navigation: NavigationData,
  options: {
    outputDir: string;
    layoutDir: string;
    basePath: string;
    dev: boolean;
  },
): Promise<void> {
  const { frontmatter, content } = page;
  const { outputDir, layoutDir, basePath, dev } = options;

  // Normalize basePath for template (empty string if just "/")
  const normalizedBasePath = basePath === "/" ? "" : basePath;

  // Prepare template data
  const templateData: TemplateData = {
    title: frontmatter.title,
    content,
    navigation,
    basePath: normalizedBasePath,
  };

  // Load JSX layout
  const layoutPath = resolve(
    join(layoutDir, `${LAYOUT_PREFIX}${frontmatter.layout}${LAYOUT_SUFFIX}`),
  );

  let html: string;
  try {
    html = await renderJsxLayout(layoutPath, templateData);
  } catch (error) {
    throw new Error(
      `Failed to render layout ${layoutPath} (required by ${page.filepath}): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  // Inject hot reload script in dev mode
  if (dev) {
    html = injectHotReloadScript(html);
  }

  // Write output file
  const outputPath = getOutputPath(frontmatter.slug, outputDir);
  await ensureDir(dirname(outputPath));
  await Deno.writeTextFile(outputPath, html);

  logger.info(`Built: ${frontmatter.slug}`);
}

/**
 * Get output file path for a slug.
 */
function getOutputPath(slug: string, outputDir: string): string {
  // Handle root index
  if (slug === "/" || slug === "index" || slug === "") {
    return join(outputDir, "index.html");
  }

  // Regular pages
  return join(outputDir, `${slug}.html`);
}

/**
 * Ensure a directory exists.
 */
async function ensureDir(dir: string): Promise<void> {
  try {
    await Deno.mkdir(dir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

/**
 * Inject hot reload WebSocket script before </body> tag.
 */
function injectHotReloadScript(html: string): string {
  const script = `
<script>
  (function() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(protocol + '//' + host + '/__hot-reload');

    ws.onmessage = function() {
      console.log('[HMR] Reloading...');
      window.location.reload();
    };

    ws.onclose = function() {
      console.log('[HMR] Disconnected, retrying in 1s...');
      setTimeout(function() {
        window.location.reload();
      }, 1000);
    };

    ws.onerror = function() {
      console.log('[HMR] Connection error');
    };
  })();
</script>`;

  // Inject before </body> if it exists, otherwise append
  if (html.includes("</body>")) {
    return html.replace("</body>", `${script}\n</body>`);
  }

  return html + script;
}

/**
 * Write GFM CSS to output directory.
 */
async function writeGfmCss(outputDir: string): Promise<void> {
  const cssPath = join(outputDir, "gfm.css");

  // Add Prism token styles that map to GFM prettylights colors
  const prismStyles = `
/* Prism syntax highlighting using GFM prettylights colors */
.token.comment, .token.prolog, .token.doctype, .token.cdata { color: var(--color-prettylights-syntax-comment); }
.token.punctuation { opacity: 0.7; }
.token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol, .token.deleted { color: var(--color-prettylights-syntax-constant); }
.token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: var(--color-prettylights-syntax-string); }
.token.operator, .token.entity, .token.url, .language-css .token.string, .style .token.string { color: var(--color-prettylights-syntax-entity); }
.token.atrule, .token.attr-value, .token.keyword { color: var(--color-prettylights-syntax-keyword); }
.token.function, .token.class-name { color: var(--color-prettylights-syntax-entity); }
.token.regex, .token.important, .token.variable { color: var(--color-prettylights-syntax-variable); }

/* Code block padding */
.highlight pre {
  padding: 16px;
}
`;

  await Deno.writeTextFile(cssPath, GFM_CSS + prismStyles);
  logger.info(`Wrote GFM CSS`);
}

/**
 * Write production files (sitemap.xml, robots.txt, manifest.webmanifest).
 */
async function writeProductionFiles(
  pages: Frontmatter[],
  siteMetadata: SiteMetadata,
  basePath: string,
  outputDir: string,
  assetMap: AssetMap,
): Promise<void> {
  // Generate and write sitemap.xml
  const sitemap = generateSitemap(pages, siteMetadata.siteUrl, basePath);
  const sitemapPath = join(outputDir, "sitemap.xml");
  await Deno.writeTextFile(sitemapPath, sitemap);
  logger.info(`Wrote sitemap.xml`);

  // Generate and write robots.txt
  const robotsTxt = generateRobotsTxt(siteMetadata.siteUrl, basePath);
  const robotsPath = join(outputDir, "robots.txt");
  await Deno.writeTextFile(robotsPath, robotsTxt);
  logger.info(`Wrote robots.txt`);

  // Generate and write manifest.webmanifest
  const manifest = generateManifest(siteMetadata, basePath, assetMap);
  const manifestPath = join(outputDir, "manifest.webmanifest");
  await Deno.writeTextFile(manifestPath, manifest);
  logger.info(`Wrote manifest.webmanifest`);
}
