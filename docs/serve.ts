import { resolve } from "@std/path";
import { MageApp } from "../app/mod.ts";
import { serveFiles } from "../serve-files/mod.ts";
import { MageLogger } from "../logs/mod.ts";

const logger = new MageLogger("Docs Serve");

const app = new MageApp();

const docsDir = import.meta.dirname!;

app.get("/*", serveFiles({ directory: resolve(docsDir, "./_site") }));

logger.info("🚀 Server starting at http://localhost:3000");
logger.info("📦 Serving static files from ./_site");

Deno.serve(app.handler);
