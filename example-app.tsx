import { MageApp, StatusCode, useSecurityHeaders } from "./mod.ts";
import { useServeFile } from "./src/middleware/serve-file.ts";

const app = new MageApp();

app.use(useSecurityHeaders());

app.get("/text", (context) => {
  context.text(StatusCode.OK, "Hello, World!");
});

app.get("/json", (context) => {
  context.json(StatusCode.OK, { message: "Hello, World!" });
});

app.get("/render", async (context) => {
  await context.render(
    StatusCode.OK,
    <html lang="en">
      <body>
        <h1>Hello, World!</h1>
      </body>
    </html>,
  );
});

app.get("/rewrite", async (context) => {
  await context.rewrite("/target");
});

app.get("/target", (context) => {
  context.json(StatusCode.OK, {
    message: context.url.searchParams.get("message"),
  });
});

app.get("/public/*", useServeFile({ directory: "./public" }));

app.run({
  port: 8000,
  onListen({ hostname, port }) {
    console.log(`Listening on http://${hostname}:${port}`);
  },
});
