<h1 align="center">Mage Server</h1>
<div align="center">
  <img src="https://github.com/user-attachments/assets/558a5409-0a48-4ef7-a119-c3c4b251dba8"/>
</div>
<div align="center">
  Build web applications with <a href="https://deno.com">Deno</a> and <a href="https://preactjs.com">Preact</a>
</div>

## Installation

```sh
deno add jsr:@mage/server npm:preact
```

## Getting started

Minimum TypeScript compiler options:

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
import { MageApp, StatusCode, useSecurityHeaders } from "@mage/server";

const app = new MageApp();

app.use(useSecurityHeaders());

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
    </html>,
  );
});

app.run({
  port: 8000,
  onListen({ hostname, port }) {
    console.log(`Listening on http://${hostname}:${port}`);
  },
});
```

## Middleware

APIs are composed of stacked middleware. A simple middleware looks like this:

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

A context object is passed to each middleware.

### Url

The URL is parsed and placed on the context.

```tsx
context.url.pathname
context.url.searchParams
...
```

### Request

The request object is available on the context.

```tsx
context.request.method
context.request.headers.get("Content-Type")
await context.request.text()
...
```

### Response

The response object is available on the context.

```tsx
context.response.headers.set("Content-Type", "text/plain");
context.response.headers.delete("Content-Type", "text/plain");
```

### Response utilities

A number of utility methods are available to configure the response content.

#### `text`

Respond with text.

```tsx
context.text(StatusCode.OK, "Hello, World!");
```

#### `json`

Respond with JSON.

```tsx
context.json(StatusCode.OK, { message: "Hello, World!" });
```

#### `render`

Render JSX to HTML using [Preact](https://preactjs.com).

```tsx
await context.render(
  StatusCode.OK,
  <html lang="en">
    <body>
      <h1>Hello, World!</h1>
    </body>
  </html>,
);
```

#### `empty`

Respond with an empty response, useful for response like `204 No Content`.

```tsx
context.empty(StatusCode.NoContent);
```

#### `redirect`

Redirect the request to another location.

```tsx
context.redirect(RedirectType.Permanent, "/new-location");
```

#### `rewrite`

You can rewrite requests to another location. This works for local and external
URLs.

**NOTE: This is not optimal for local redirects, as it will make a new request
to the provided location. This is useful for proxying requests to another
server.**

```tsx
await context.rewrite("/new-location");
await context.rewrite("https://example.com");
```

### Cookies

You can read cookies from the request.

```tsx
context.cookies.get("name");
```

You can set and delete cookies on the response.

```tsx
context.cookies.set("name", "value");
context.cookies.delete("name");
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
