import { walk } from "@std/fs";
import { dirname, join, resolve } from "@std/path";
import { CSS as GFM_CSS } from "@deno/gfm";
import { MageLogger } from "../logs/mod.ts";
import { type Frontmatter, parseMarkdown } from "./parser.ts";
import { renderTemplate, type TemplateData } from "./template.ts";
import { generateNavigation } from "./navigation.ts";

const logger = new MageLogger("Markdown App");

/**
 * Load Prism syntax highlighting language components dynamically.
 */
async function loadSyntaxHighlightLanguages(
  languages: string[],
): Promise<void> {
  const PRISM_VERSION = "1.29.0";

  for (const lang of languages) {
    try {
      await import(`npm:prismjs@${PRISM_VERSION}/components/prism-${lang}.js`);
    } catch (error) {
      logger.warn(
        `Failed to load syntax highlighting for language "${lang}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

/**
 * Options for building markdown files to static HTML.
 */
export interface BuildOptions {
  sourceDir: string;
  outputDir: string;
  layoutDir: string;
  basePath: string;
  dev: boolean;
  syntaxHighlightLanguages: string[];
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
    syntaxHighlightLanguages,
  } = options;

  logger.info(`Building markdown files from ${sourceDir}...`);

  // Step 1: Load syntax highlighting languages
  await loadSyntaxHighlightLanguages(syntaxHighlightLanguages);

  // Step 2: Find all markdown files
  const markdownFiles = await findMarkdownFiles(sourceDir);
  logger.info(`Found ${markdownFiles.length} markdown files`);

  if (markdownFiles.length === 0) {
    logger.warn(`No markdown files found in ${sourceDir}`);
    return;
  }

  // Step 3: Parse all markdown files
  const pages = await parseAllFiles(markdownFiles);
  logger.info(`Parsed ${pages.length} pages`);

  // Step 4: Build each page
  for (const page of pages) {
    await buildPage(page, pages, {
      outputDir,
      layoutDir,
      basePath,
      dev,
    });
  }

  // Step 5: Write GFM CSS
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
