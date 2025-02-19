import { resolve } from "@std/path";
import { MageApp } from "../../app/mod.ts";
import { tailwindCSS } from "./plugins/tailwindcss.ts";
import { useServeFiles } from "../../serve-files/mod.ts";

export const app = new MageApp();

app.plugin(tailwindCSS({
  entry: "./example/src/main.css",
  output: "./example/public/main.css",
  configFilepath: "./example/tailwind.config.ts",
}));

app.get("/", (c) => {
  c.html(`<link rel="stylesheet" href="/public/main.css">
    <h1 class="page-title">Hello, world!!!</h1>`);
});

app.get(
  "/public/*",
  useServeFiles({
    directory: resolve(Deno.cwd(), "example/public"),
  }),
);
