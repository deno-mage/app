<p align="center" style="color: #343a40">
  <img src="https://raw.githubusercontent.com/deno-mage/server/main/mage.png" alt="Emotion logo" height="150" width="150">
  <h1 align="center">Mage</h1>
</p>
<div align="center">
  Build web applications with <a href="https://deno.com">Deno</a>
</div>

## Mage App

`@mage/app` is a web application framework for Deno. It is designed to be
familiar and easy to use. It is built on top of Deno's built-in HTTP server and
provides a simple API for building web applications and APIs.

### Getting started

```sh
deno add jsr:@mage/app
```

An example app:

```tsx
import { MageApp } from "@mage/app";

const app = new MageApp();

app.get("/", async (c) => {
  c.text("Hello, world!");
});

Deno.serve(app.handler);
```

Run the app:

```
deno run --allow-all main.tsx
```
