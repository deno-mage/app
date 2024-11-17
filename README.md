# Mage

Simple, composable APIs and web apps for Deno.

## Getting started

An example app:

```tsx
import { MageApp, middleware, StatusCode } from "@mage/app";

const app = new MageApp();

app.use(
  middleware.useSecurityHeaders(),
  middleware.useErrors(),
  middleware.useNotFound()
);

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
    </html>
  );
});

app.run({
  port: 8000,
});
```

## Middleware

Mage APIs are composed of stacked middleware. A simple middlware looks like this:

```tsx
app.get("/", async (context, next) => {
  console.log("Request received");

  await next();
});
```

If you want to complete handling a request you simply don't call the next middleware:

```tsx
app.get("/", (context) => {
  context.text(StatusCode.OK, "Hello, World!");
});
```

### Available middleware

A collection of prebuilt middleware is available to use.

|                        |                                           |
| ---------------------- | ----------------------------------------- |
| `useCors()`            | Configure CORS request handling           |
| `useSecurityHeaders()` | Adds security headers to the response     |
| `useErrors()`          | Logs error and responds with 500          |
| `useNotFound()`        | Responds with 404 when no response is set |

## Context

The context object is passed to each middleware and contains details about the request and response. Additionally it contains utility functions to respond to the request.

```tsx
// Text response
context.text(StatusCode.OK, "Hello, World!");

// JSON response
context.json(StatusCode.OK, { message: "Hello, World!" });

// Render JSX to HTML response
await context.render(
  StatusCode.OK,
  <html lang="en">
    <body>
      <h1>Hello, World!</h1>
    </body>
  </html>
);
```

You can also configure headers for the response:

```tsx
context.response.headers.set("Content-Type", "text/plain");
context.response.headers.delete("Content-Type", "text/plain");
```

You can determine if a request has been matched to a route by checking `matchedPathname` on the context.

```tsx
app.get("/books/:id", (context) => {
  if (context.matchedPathname) {
    console.log(`Matched: ${context.matchedPathname}`);
    // Matched: /books/:id
  }
});
```

## Routing

You can register middleware to execute on every route and method via the `app.use` method. This is useful for middleware that should run on every request.

```tsx
app.use(async (context, next) => {
  console.log("Request received");

  await next();
});
```

Routes can be registered for each HTTP method:

```tsx
app.get("/", (context) => {
  context.text(StatusCode.OK, "Hello, World!");
});

app.post("/", (context) => {
  context.text(StatusCode.OK, "Hello, World!");
});

// ... delete, put, patch, options, head, all
```

You can configure multiple middleware at a time on a route too:

```tsx
app.get("/", middleware.useSecurityHeaders(), (context) => {
  context.text(StatusCode.OK, "Hello, World!");
});
```
