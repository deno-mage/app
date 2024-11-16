import { MageApp, middleware, StatusCode } from "./exports.ts";

const app = new MageApp();

app.use(
  middleware.useSecurityHeaders(),
  middleware.useErrorHandler(),
  middleware.useNotFoundHandler()
);

app.get("/text", (context) => {
  context.text(StatusCode.OK, "Hello, World!");
});

app.get("/json", (context) => {
  context.json(StatusCode.OK, { message: "Hello, World!" });
});

app.get("/html", (context) => {
  context.html(
    StatusCode.OK,
    <html lang="en">
      <body>
        <h1>Hello, World!</h1>
      </body>
    </html>
  );
});

app.run({
  port: 8000,
});
