import { app } from "./src/app.ts";

await app.develop();

Deno.serve(app);
