import { MageApp, middleware, StatusCode } from "./exports.ts";

const app = new MageApp();

app.use(
  middleware.useSecurityHeaders(),
  middleware.useErrors(),
  middleware.useNotFound(),
);

app.options(middleware.useAllow());

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

app.run({
  port: 8000,
});
