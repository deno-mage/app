import { markdownApp } from "../mod.ts";
import { MageLogger } from "../../logs/logger.ts";

const logger = new MageLogger("Markdown App Example");

const { build } = markdownApp({
  articlesDir: "./docs",
  outputDir: "./docs/_site",
  layoutDir: "./docs",
  basePath: "/",
  dev: false,
});

await build();

logger.success("✅ Build complete!");
logger.info("📦 Static files ready in ./docs/_site\n");
