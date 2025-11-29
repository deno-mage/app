import { MageApp } from "../app/mod.ts";
import { pages } from "../pages-next/mod.ts";
import { MageLogger } from "../logs/mod.ts";

const logger = new MageLogger("Mage Pages");

const { registerDevServer } = pages();

const app = new MageApp();
await registerDevServer(app, { rootDir: "./docs" });

Deno.serve({
  port: 3000,
  onListen: () => logger.info("Available at http://localhost:3000"),
}, app.handler);
