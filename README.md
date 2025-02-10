<p align="center" style="color: #343a40">
  <img src="https://raw.githubusercontent.com/deno-mage/server/main/mage.png" alt="Emotion logo" height="150" width="150">
  <h1 align="center">Mage Server</h1>
</p>
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
import { MageApp, StatusCode } from "@mage/server";

const app = new MageApp();

app.get("/", (context) => {
  context.text(StatusCode.OK, "Hello, World!");
});

Deno.serve(app.build());
```

Run the app:

```
deno run --allow-all main.tsx
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

You can register middleware to execute on every route and method via the
`app.use` method. This is useful for middleware that should run on every
request.

```tsx
app.use(async (context, next) => {
  console.log("Request received");

  await next();
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

### Available middleware

A collection of prebuilt middleware is available to use.

|                       |                                                               |
| --------------------- | ------------------------------------------------------------- |
| `useCors`             | Configure CORS request handling                               |
| `useMethodNotAllowed` | Responds with 405, ignores preflight (OPTIONS) requests       |
| `useNotFound`         | Responds with 404, ignores preflight (OPTIONS) requests       |
| `useOptions`          | Responds to preflight (OPTIONS) requests                      |
| `useSecurityHeaders`  | Adds recommended security headers to the response             |
| `useServeFiles`       | Serve files from a durectory based on the wildcard on context |
| `useValidate`         | Validate request body based on a schema                       |

## Context

A context object is passed to each middleware.

### MageRequest

The request object is available on the context as a `MageRequest` that provides
memoized access to the body.

This is useful because the body of a request can only be read once. If you rea
the body of a request, and then try to read it again, you will get an er r. This
class memoizes the body of the request so that you can read it ultiple times by
middlewar

```tsx
context.request.method
context.request.url
context.request.header("Content-Type")
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

**NOTE: This is not optimal for local rewrites, as it will make a new request to
the provided location. This is useful for proxying requests to another server.**

```tsx
await context.rewrite("/new-location");
await context.rewrite("https://example.com");
```

#### `serveFile`

Serve a file from the file system.

```tsx
await context.serveFile("path/to/file");
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

### Parameters

Parameters are parsed from the URL and placed on the context.

```tsx
// /user/:id/post/:postId -> /user/1/post/2

context.params.id; // 1
context.params.postId; // 2
```

### Wildcards

Wildcards are parsed from the URL and placed on the context.

```tsx
// /public/* -> /public/one/two/three

context.wildcard; // one/two/three
```

### Validation

You can validate the request based on a schema using the `useValidate()`
middleware based on a [Standard Schema](https://jsr.io/@standard-schema/spec)
schema.

You can define where the validator should source the data from.

- `json` - The request body
- `form` - The request form data
- `params` - The route params
- `search-params` - The URL search parameters

```tsx
app.use(useValidate("json", schema));
```

When this middleware is used, the request body will be validated and the result
will be placed on `context`. You can access it using:

```tsx
context.valid("json", schema);
```

### Web sockets

You can upgrade a request to a web socket connection. If the request is not a
WebSocket request it will send a 501 Not Implemented response and no WebSocket
will be created.

```tsx
app.get("/ws", async (context) => {
  context.webSocket((socket) => {
    socket.onmessage = (event) => {
      if (event.data === "ping") {
        socket.send("pong");
      }
    };
  });
});
```

### Assets

You can get a cache busted path for the asset via the `context.asse()` method.
This will append the build id to the asset path. The `useServeFiles` middleware
supports serving the files and stripping the build id from the path. Files that
have been cache busted in this way will be served with a `Cache-Control` header
set to `max-age=31536000` (1 year).

```tsx
app.get("/public/*", useServeFiles({ directory: "./public" }));

app.get("/", async (context) => {
  await context.render(
    StatusCode.OK,
    <html lang="en">
      <body>
        <img src={context.asset("/public/image.png")} />
      </body>
    </html>,
  );
});
```

## Routing

### HTTP methods

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

### Paths

Paths can be simple:

```tsx
app.get("/one", (context) => {
  context.text(StatusCode.OK, "Simple path");
});

app.get("/one/two", (context) => {
  context.text(StatusCode.OK, "Simple path");
});

app.get("/one/two/three", (context) => {
  context.text(StatusCode.OK, "Simple path");
});
```

### Parameters

Paths can contain parameters that will be available on `context.params.<name>`
as strings.:

```tsx
app.get("/user/:id", (context) => {
  context.text(StatusCode.OK, `User ID: ${context.params.id}`);
});

app.get("/user/:id/post/:postId", (context) => {
  context.text(
    StatusCode.OK,
    `User ID: ${context.params.id}, Post ID: ${context.params.postId}`,
  );
});
```

### Wildcards

Paths can contain wildcards that will match any path. Wildcards must be at the
end of the path.

```tsx
app.get("/public/*", (context) => {
  context.text(StatusCode.OK, "Wildcard path");
});
```

The path portion captured by the wildcard is available on `context.wildcard`.

```tsx
app.get("/public/*", (context) => {
  context.text(StatusCode.OK, `Wildcard path: ${context.wildcard}`);
});
```

Wildcards are inclusive of the path its placed on. This means that the wildcard
will match any path that starts with the wildcard path.

```tsx
app.get("/public/*", (context) => {
  context.text(StatusCode.OK, "Wildcard path");
});

/**
 *  matches:
 *
 *  /public
 *  /public/one
 *  /public/one/two
 */
```

## Running your app

To run your app, you can use the `Deno.serve` function:

```tsx
Deno.serve(app.build());
```

## Header utilities

Some utility methods are available to configure common complex response headers.

### `cacheControl`

Set the `Cache-Control` header.

```tsx
cacheControl(context, {
  maxAge: 60,
});
```

### `contentSecurityPolicy`

Set the `Content-Security-Policy` header.

```tsx
contentSecurityPolicy(context, {
  directives: {
    defaultSrc: "'self'",
    scriptSrc: ["'self'", "https://example.com"],
  },
});
```
