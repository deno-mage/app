import { MageApp, MageMiddleware, StatusCode } from "./main.ts";

const app = new MageApp();

app.use(...MageMiddleware.recommended());

app.get("/text", (context) => {
  context.text(StatusCode.OK, "Hello, World!");
});

app.get("/json", (context) => {
  context.json(StatusCode.OK, { message: "Hello, World!" });
});

app.get("/render-static", (context) => {
  context.renderStatic(
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
