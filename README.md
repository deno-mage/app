# Mage

Simple, composable APIs and web apps for Deno.

## Getting started

An example app:

```tsx
import { MageApp, StatusCode, useSecurityHeaders } from "./exports.ts";

const app = new MageApp();

app.use(useSecurityHeaders());

app.get("/text", (context) => {
  context.text(StatusCode.OK, "Hello, World!");
});

app.get("/json", (context) => {
  context.json(StatusCode.OK, { message: "Hello, World!" });
});

app.get("/render", async (context) => {
  await context.html(
    StatusCode.OK,
    <html lang="en">
      <body>
        <h1>Hello, World!</h1>
      </body>
    </html>,
  );
});

app.run({
  port: 8000,
  onListen({ hostname, port }) {
    console.log(`Listening on ${hostname}:${port}`);
  },
});
```

## Middleware

APIs are composed of stacked middleware. A simple middlware looks like this:

```tsx
app.get("/", async (context, next) => {
  console.log("Request received");

  await next();
});
```

If you want to complete handling a request you simply don't call the next
middleware:

```tsx
app.get("/", (context) => {
  context.text(StatusCode.OK, "Hello, World!");
});
```

### Available middleware

A collection of prebuilt middleware is available to use.

|                       |                                                         |
| --------------------- | ------------------------------------------------------- |
| `useCors`             | Configure CORS request handling                         |
| `useMethodNotAllowed` | Responds with 405, ignores preflight (OPTIONS) requests |
| `useNotFound`         | Responds with 404, ignores preflight (OPTIONS) requests |
| `useOptions`          | Responds to preflight (OPTIONS) requests                |
| `useSecurityHeaders`  | Adds recommended security headers to the response       |

## Context

The context object is passed to each middleware and contains details about the
request and response.

```tsx
app.post("/", async (context) => {
  console.log(context.url);
  console.log(context.request.method
  console.log(context.request.headers.get("Content-Type"));
  console.log(await context.request.text());
});
```

Additionally it contains utility functions to respond to the request.

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
  </html>,
);

// Empty response
context.empty(StatusCode.NoContent);

// Redirect
context.redirect(RedirectType.Permanent, "/new-location");
```

You can also configure headers for the response:

```tsx
context.response.headers.set("Content-Type", "text/plain");
context.response.headers.delete("Content-Type", "text/plain");
```

## Routing

You can register middleware to execute on every route and method via the
`app.use` method. This is useful for middleware that should run on every
request.

```tsx
app.use(async (context, next) => {
  console.log("Request received");

  await next();
});
```

Routes can be registered for each HTTP method against a route:

```tsx
app.get("/", (context) => {
  context.text(StatusCode.OK, "Hello, World!");
});

// ... post, delete, put, patch, options, head, all
```

You can also register a route for all HTTP methods:

```tsx
app.all("/", (context) => {
  context.text(StatusCode.OK, "Hello, World!");
});
```

You can exclude the route and just register middleware against a HTTP method:

```tsx
app.options((context) => {
  console.log("Custom OPTIONS handler");
});
```

You can configure multiple middleware at a time:

```tsx
app.get(
  "/",
  (context) => {
    context.text(StatusCode.OK, "One!");
  },
  (context) => {
    context.text(StatusCode.OK, "Two!");
  },
  (context) => {
    context.text(StatusCode.OK, "Three!");
  },
  // ... etc
);
```
