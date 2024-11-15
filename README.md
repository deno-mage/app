# Mage

Simple, composable APIs for Deno.

## Getting started

An example app:

```tsx
import { MageApp, middleware, StatusCode } from "./main.ts";

const app = new MageApp();

app.use(
  middleware.setSecurityHeaders(),
  middleware.handleErrors(),
  middleware.handleUnhandledRequests()
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
```
