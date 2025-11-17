import { resolve } from "@std/path";
import { MageApp } from "../app/mod.ts";
import { markdownApp } from "../markdown-app/mod.ts";
import { MageLogger } from "../logs/mod.ts";

const logger = new MageLogger("Docs Dev");

const app = new MageApp();

const docsDir = import.meta.dirname!;

const { register, watch } = markdownApp({
  articlesDir: resolve(docsDir, "./articles"),
  outputDir: resolve(docsDir, "./_site"),
  layoutDir: resolve(docsDir, "./layouts"),
  assetsDir: resolve(docsDir, "./assets"),
  basePath: "/",
  dev: true,
  siteMetadata: {
    siteName: "Mage App",
    siteUrl: "http://localhost:3000",
    description: "A modern web framework for Deno.",
  },
});

// Register routes (serveFiles + WebSocket) BEFORE building
register(app);

// Start server BEFORE watch (so WebSocket endpoint is ready)
Deno.serve({ port: 3000 }, app.handler);

logger.info("🚀 Server starting at http://localhost:3000");
logger.info(
  "📝 Edit markdown files in ./articles to see hot reload in action!",
);

// Start file watcher (does initial build, then watches for changes)
// This runs after server is started so WebSocket is ready
await watch();
