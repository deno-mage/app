# Mage

Simple, composable APIs and web apps for Deno.

## Getting started

An example app:

```tsx
import { MageApp, middleware, StatusCode } from "@mage/app";

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
```

## Middleware

Mage APIs are composed of stacked middleware. A simple middlware looks like this:

```tsx
app.get("/", async (context, next) => {
  context.text(StatusCode.OK, "Hello, World!");

  await next();
});
```

The next middleware will automatically be called if you don't call it so this is equivalent:

```tsx
app.get("/", (context, next) => {
  context.text(StatusCode.OK, "Hello, World!");
});
```

### Available middleware

A collection of prebuilt middleware is available to use.

|                        |                                                                    |
| ---------------------- | ------------------------------------------------------------------ |
| `useSecurityHeaders()` | Adds security headers to the response                              |
| `useErrorHandler()`    | Logs error and responds with 500                                   |
| `useNotFoundHandler()` | Responds with 404 when no response is set                          |
| `useOptions(config)`   | Handle OPTIONS requests, this is configured out the box internally |

## Context

The context object is passed to each middleware and contains details about the request and response. Additionally it contains utility functions to respond to the request.

```tsx
// Text response
context.text(StatusCode.OK, "Hello, World!");

// JSON response
context.json(StatusCode.OK, { message: "Hello, World!" });

// HTML response (JSX)
context.html(
  StatusCode.OK,
  <html lang="en">
    <body>
      <h1>Hello, World!</h1>
    </body>
  </html>
);
```

You can also set headers for the response:

```tsx
context.set("Content-Type", "text/plain");
```

You can determine if a request has been matched to a route by checking `isRouteMatched` on the context:

```tsx
if (context.isRouteMatched) {
  // Request has been handled
}
```

## Routing

You can register middleware to execute on every route and method via the `app.use` method. This is useful for middleware that should run on every request.

```tsx
app.use((context) => {
  console.log("Request received");
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
