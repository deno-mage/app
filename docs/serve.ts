import { MageApp } from "../app/mod.ts";
import { pages } from "../pages/mod.ts";

const { registerStaticServer } = pages();

const app = new MageApp();
registerStaticServer(app, { rootDir: "./docs/dist" });

Deno.serve({ port: 3000 }, app.handler);
