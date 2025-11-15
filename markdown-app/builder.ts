import { walk } from "@std/fs";
import { dirname, join, resolve } from "@std/path";
import { CSS as GFM_CSS } from "@deno/gfm";
import { MageLogger } from "../logs/mod.ts";
import { type Frontmatter, parseMarkdown } from "./parser.ts";
import { renderTemplate, type TemplateData } from "./template.ts";
import { generateNavigation } from "./navigation.ts";

const logger = new MageLogger("Markdown App");

/**
 * Options for building markdown files to static HTML.
 */
export interface BuildOptions {
  sourceDir: string;
  outputDir: string;
  layoutDir: string;
  basePath: string;
  dev: boolean;
}

/**
 * Build all markdown files from sourceDir to outputDir.
 */
export async function build(options: BuildOptions): Promise<void> {
  const {
    sourceDir,
    outputDir,
    layoutDir,
    basePath,
    dev,
  } = options;

  logger.info(`Building markdown files from ${sourceDir}...`);

  // Step 1: Find all markdown files
  const markdownFiles = await findMarkdownFiles(sourceDir);
  logger.info(`Found ${markdownFiles.length} markdown files`);

  if (markdownFiles.length === 0) {
    logger.warn(`No markdown files found in ${sourceDir}`);
    return;
  }

  // Step 2: Parse all markdown files
  const pages = await parseAllFiles(markdownFiles);
  logger.info(`Parsed ${pages.length} pages`);

  // Step 3: Build each page
  for (const page of pages) {
    await buildPage(page, pages, {
      outputDir,
      layoutDir,
      basePath,
      dev,
    });
  }

  // Step 4: Write GFM CSS
  await writeGfmCss(outputDir);

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
 * Parse all markdown files.
 */
async function parseAllFiles(files: string[]): Promise<ParsedPage[]> {
  const pages: ParsedPage[] = [];

  for (const filepath of files) {
    try {
      const fileContent = await Deno.readTextFile(filepath);
      const parsed = parseMarkdown(fileContent, filepath);

      pages.push({
        filepath,
        frontmatter: parsed.frontmatter,
        content: parsed.content,
      });
    } catch (error) {
      logger.error(
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  return pages;
}

/**
 * Build a single page to HTML.
 */
async function buildPage(
  page: ParsedPage,
  allPages: ParsedPage[],
  options: {
    outputDir: string;
    layoutDir: string;
    basePath: string;
    dev: boolean;
  },
): Promise<void> {
  const { frontmatter, content } = page;
  const { outputDir, layoutDir, basePath, dev } = options;

  // Load layout template
  const layoutPath = join(layoutDir, `_layout-${frontmatter.layout}.html`);
  let layoutTemplate: string;

  try {
    layoutTemplate = await Deno.readTextFile(layoutPath);
  } catch {
    throw new Error(
      `Layout file not found: ${layoutPath} (required by ${page.filepath})`,
    );
  }

  // Generate navigation
  const navigation = generateNavigation(
    allPages.map((p) => p.frontmatter),
    frontmatter.slug,
    basePath,
  );

  // Normalize basePath for template (empty string if just "/")
  const normalizedBasePath = basePath === "/" ? "" : basePath;

  // Prepare template data
  const templateData: TemplateData = {
    title: frontmatter.title,
    content,
    navigation,
    basePath: normalizedBasePath,
  };

  // Render template
  let html = renderTemplate(layoutTemplate, templateData);

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
  await Deno.writeTextFile(cssPath, GFM_CSS);
  logger.info(`Wrote GFM CSS`);
}
