<p align="center" style="color: #343a40">
  <img src="https://raw.githubusercontent.com/deno-mage/server/main/mage.png" alt="Emotion logo" height="150" width="150">
  <h1 align="center">Mage</h1>
</p>
<div align="center">
  Build web applications with <a href="https://deno.com">Deno</a> and <a href="https://preactjs.com">Preact</a>
</div>

## Mage Headers

`@mage/headers` is a collection of utilities for constructing some of the more
complex HTTP headers.

### Getting started

```sh
deno add jsr:@mage/headers
```

An example:

```ts
import { createCacheControlHeader } from "@mage/headers";

createCacheControlHeader({
  maxAge: 60,
  public: true,
});
```
