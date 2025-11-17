import { resolve } from "@std/path";
import { markdownApp } from "../markdown-app/mod.ts";
import { MageLogger } from "../logs/mod.ts";

const logger = new MageLogger("Docs Build");

const docsDir = import.meta.dirname!;

const { build } = markdownApp({
  articlesDir: resolve(docsDir, "./articles"),
  outputDir: resolve(docsDir, "./_site"),
  layoutDir: resolve(docsDir, "./layouts"),
  assetsDir: resolve(docsDir, "./assets"),
  basePath: "/",
  dev: false,
  siteMetadata: {
    siteName: "Mage App",
    siteUrl: "https://deno-mage.dev",
    description: "A modern web framework for Deno.",
  },
});

await build();

logger.success("✅ Build complete!");
logger.info("📦 Static files ready in ./_site\n");
