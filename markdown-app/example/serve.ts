import { MageApp } from "../../app/app.ts";
import { markdownApp } from "../mod.ts";
import { MageLogger } from "../../logs/logger.ts";

const logger = new MageLogger("Markdown App Example");

const app = new MageApp();

const { register, watch } = markdownApp({
  sourceDir: "./docs",
  outputDir: "./docs/_site",
  layoutDir: "./docs",
  basePath: "/",
  dev: true,
});

// Register routes (serveFiles + WebSocket) BEFORE building
register(app);

// Start server BEFORE watch (so WebSocket endpoint is ready)
Deno.serve({ port: 3000 }, app.handler);

logger.info("🚀 Server starting at http://localhost:3000");
logger.info("📝 Edit markdown files in ./docs to see hot reload in action!");

// Start file watcher (does initial build, then watches for changes)
// This runs after server is started so WebSocket is ready
await watch();
