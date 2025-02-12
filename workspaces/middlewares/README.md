<p align="center" style="color: #343a40">
  <img src="https://raw.githubusercontent.com/deno-mage/server/main/mage.png" alt="Emotion logo" height="150" width="150">
  <h1 align="center">Mage</h1>
</p>
<div align="center">
  Build web applications with <a href="https://deno.com">Deno</a> and <a href="https://preactjs.com">Preact</a>
</div>

## Mage Middlewares

`@mage/middlewares` is a collection of first party middlewares for use with Mage
apps.

### Getting started

```sh
deno add jsr:@mage/middlewares
```

An example:

```ts
import { useCORS, useSecurityHeaders } from "@mage/middlewares";

const app = new MageApp();

app.use(
  useSecurityHeaders(),
  useCORS({
    origins: "*",
  }),
);
```
