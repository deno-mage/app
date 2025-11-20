import { MageApp } from "../app/mod.ts";
import { pages } from "../pages/mod.ts";

const { registerDevServer } = pages();

const app = new MageApp();
await registerDevServer(app, { rootDir: "./docs", basePath: "/docs" });

Deno.serve({ port: 3000 }, app.handler);
