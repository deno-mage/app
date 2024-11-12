import "./imports/react.ts";
import { renderToReadableStream } from "./imports/react-dom/server.ts";

Deno.serve(async (_req) => {
  return new Response(await renderToReadableStream(<div>Hello, World!!!</div>));
});
