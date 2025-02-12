<p align="center" style="color: #343a40">
  <img src="https://raw.githubusercontent.com/deno-mage/server/main/mage.png" alt="Emotion logo" height="150" width="150">
  <h1 align="center">Mage</h1>
</p>
<div align="center">
  Build web applications with <a href="https://deno.com">Deno</a> and <a href="https://preactjs.com">Preact</a>
</div>

## Mage App

`@mage/app` is a web application framework for Deno. It is designed to be
familiar and easy to use. It is built on top of Deno's built-in HTTP server and
provides a simple API for building web applications and APIs.

### Getting started

```sh
deno add jsr:@mage/app
```

If you plan on using `Preact` you should also install it.

```sh
deno add jsr:@mage/app npm:preact
```

Minimum TypeScript compiler options when using Preact.

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

An example app:

```tsx
import { MageApp, StatusCode } from "@mage/app";

const app = new MageApp();

app.get("/", async (context) => {
  await context.render(StatusCode.OK, <h1>Hello, World!</h1>);
});

Deno.serve(app.build());
```

Run the app:

```
deno run --allow-all main.tsx
```
