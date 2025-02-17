import { parseArgs } from "jsr:@std/cli/parse-args";
import type { MageApp } from "../app/mod.ts";

const flags = parseArgs(Deno.args, {
  boolean: ["dev", "build"],
});

const { app } = await import(flags._[0].toString()) as { app: MageApp };

if (flags.build && flags.dev) {
  console.error("Cannot specify both --dev and --build");
  Deno.exit(1);
}

let flag = "";

if (flags.dev) {
  flag = "dev";
}

if (flags.build) {
  flag = "build";
}

switch (flag) {
  case "dev":
    app.develop();
    Deno.serve(app.handler);
    break;
  case "build":
    await app.build();
    break;
  default:
    Deno.serve(app.handler);
    break;
}
