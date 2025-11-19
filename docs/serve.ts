import { MageApp } from "../app/mod.ts";
import { pages } from "../pages/mod.ts";

const { registerStaticServer } = pages();

const app = new MageApp();
registerStaticServer(app, { rootDir: "./docs/dist", basePath: "/docs" });

Deno.serve({ port: 8000 }, app.handler);
