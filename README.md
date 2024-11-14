# Mage

Simple, composable APIs for Deno.

## Getting started

Minimal setup, return text:

```tsx
import { MageApp } from "./mage/mage-app.ts";
import { StatusCode } from "./mage/utils/status-codes.ts";

const app = new MageApp();

app.get("/", (context) => {
  context.text(StatusCode.OK, "Hello, World!");
});

app.run({
  port: 8000,
});
```

Return JSON:

```tsx
app.post("/", (context) => {
  context.json(StatusCode.OK, { message: "Hello, World!" });
});
```

Render JSX to static HTML:

```tsx
app.get("/", (context) => {
  context.renderStatic(
    StatusCode.OK,
    <html lang="en">
      <body>
        <h1>Hello, World!</h1>
      </body>
    </html>
  );
});
```

Plug in common middleware:

```tsx
import {
  handleErrors,
  handleUnhandled,
  minifyJson,
  setSecureHeaders,
} from "./mage/middleware.ts";

// will automatically return 500 if an error is thrown
app.use(handleErrors());

// will set recommended security headers
app.use(setSecureHeaders());

// will automatically return 404 if no route is found
app.use(handleUnhandled());

// will minify JSON responses
app.use(minifyJson());
```

You can chain middleware together for individual requests:

```tsx
// only this route will minify JSON
app.get("/small-json", minifyJson(), (context) => {
  context.json(StatusCode.OK, { message: "Hello, World!" });
});
```
