---
title: "Getting Started"
description: "Build your first Mage application"
layout: "article"
---

# Getting Started

This guide walks you through building your first Mage application. You'll start
with a simple "Hello World" and progressively add routes, middleware, and
request handling.

## Prerequisites

Make sure you have Deno installed and have added Mage to your project:

```bash
deno add jsr:@mage/app
```

See the [Installation](/installation) guide if you need help getting set up.

## Hello World

Let's start with the simplest possible application. Create a file called
`main.ts`:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

app.get("/", (c) => {
  c.text("Hello, world!");
});

Deno.serve(app.handler);
```

This creates a new Mage application, registers a single route for the root path,
and starts the server.

Run it with:

```bash
deno run --allow-all main.ts
```

Open your browser to `http://localhost:8000` and you'll see "Hello, world!".

### What's happening here?

- **`MageApp`** is the core application class that handles routing and
  middleware
- **`app.get()`** registers a route that responds to GET requests at the
  specified path
- **`c`** is the context object that contains the request and response, plus
  helper methods
- **`c.text()`** sends a plain text response
- **`Deno.serve(app.handler)`** starts the server using Deno's built-in HTTP
  server

## Running Your App

Mage uses Deno's standard `Deno.serve()` function. You can customize the server
options:

```typescript
Deno.serve({
  port: 3000,
  hostname: "127.0.0.1",
  onListen({ hostname, port }) {
    console.log(`Server running at http://${hostname}:${port}`);
  },
}, app.handler);
```

For development, `--allow-all` is convenient, but in production you should use
specific permissions:

```bash
deno run --allow-net --allow-read main.ts
```

## Adding More Routes

Let's add more routes to handle different paths and HTTP methods:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

app.get("/", (c) => {
  c.text("Home page");
});

app.get("/about", (c) => {
  c.text("About page");
});

app.post("/submit", (c) => {
  c.text("Form submitted!", 201);
});

Deno.serve(app.handler);
```

Mage supports all standard HTTP methods:

- `app.get()` - GET requests
- `app.post()` - POST requests
- `app.put()` - PUT requests
- `app.patch()` - PATCH requests
- `app.delete()` - DELETE requests
- `app.options()` - OPTIONS requests
- `app.head()` - HEAD requests
- `app.all()` - All methods

### Route Parameters

Extract dynamic values from URLs using route parameters:

```typescript
app.get("/users/:id", (c) => {
  const userId = c.req.params.id;
  c.text(`User ID: ${userId}`);
});

app.get("/posts/:postId/comments/:commentId", (c) => {
  const { postId, commentId } = c.req.params;
  c.text(`Post ${postId}, Comment ${commentId}`);
});
```

Visit `/users/123` and you'll see "User ID: 123".

### Wildcard Routes

Capture the rest of a path using wildcards:

```typescript
app.get("/files/*", (c) => {
  const filePath = c.req.wildcard;
  c.text(`File path: ${filePath}`);
});
```

Visit `/files/docs/readme.md` and you'll see "File path: docs/readme.md".

## Working with Requests and Responses

The context object (`c`) provides everything you need to work with HTTP requests
and responses.

### Reading Request Data

```typescript
app.get("/search", (c) => {
  // Get query parameters
  const query = c.req.searchParam("q");
  const page = c.req.searchParam("page") || "1";

  c.text(`Searching for: ${query}, page ${page}`);
});

app.post("/users", async (c) => {
  // Parse JSON body
  const body = await c.req.json();
  c.text(`Creating user: ${body.name}`);
});

app.get("/info", (c) => {
  // Read request headers
  const userAgent = c.req.header("user-agent");
  c.text(`Your user agent: ${userAgent}`);
});
```

### Sending Different Response Types

```typescript
app.get("/json", (c) => {
  // Send JSON response
  c.json({ message: "Hello", timestamp: Date.now() });
});

app.get("/html", (c) => {
  // Send HTML response
  c.html("<h1>Hello World</h1>");
});

app.get("/empty", (c) => {
  // Send empty response (204 No Content)
  c.empty();
});

app.get("/redirect", (c) => {
  // Redirect to another URL
  c.redirect("/", 302);
});

app.get("/file", (c) => {
  // Send a file
  c.file("./public/index.html");
});
```

### Setting Response Headers

```typescript
app.get("/custom-headers", (c) => {
  c.header("X-Custom-Header", "value");
  c.header("Cache-Control", "max-age=3600");
  c.json({ success: true });
});
```

## Adding Middleware

Middleware functions run before your route handlers. They're useful for logging,
authentication, CORS, rate limiting, and more.

### Global Middleware

Add middleware that runs for all requests:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

// Logging middleware
app.use((c, next) => {
  const start = Date.now();
  console.log(`→ ${c.req.method} ${c.req.url.pathname}`);

  // Pass control to the next handler
  const result = next();

  const duration = Date.now() - start;
  console.log(`← ${c.req.method} ${c.req.url.pathname} (${duration}ms)`);

  return result;
});

app.get("/", (c) => {
  c.text("Hello!");
});

Deno.serve(app.handler);
```

The `next()` function passes control to the next middleware or route handler.
Always return the result of `next()` so the response makes it back to the
client.

### Route-Specific Middleware

Apply middleware to specific routes:

```typescript
// Authentication middleware
const requireAuth = (c, next) => {
  const token = c.req.header("authorization");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Store user data in context for later handlers
  c.set("userId", "123");
  return next();
};

// Public route - no auth required
app.get("/", (c) => {
  c.text("Public page");
});

// Protected route - auth required
app.get("/dashboard", requireAuth, (c) => {
  const userId = c.get("userId");
  c.text(`Welcome, user ${userId}!`);
});
```

### Built-in Middleware

Mage includes middleware for common tasks:

```typescript
import { MageApp } from "@mage/app";
import { cors } from "@mage/app/cors";
import { rateLimit } from "@mage/app/rate-limit";

const app = new MageApp();

// Enable CORS
app.use(cors({
  origins: ["https://example.com"],
  methods: ["GET", "POST"],
  credentials: true,
}));

// Rate limiting
app.use(rateLimit({
  max: 100, // 100 requests
  windowMs: 60000, // per minute
}));

app.get("/api/data", (c) => {
  c.json({ data: "protected" });
});

Deno.serve(app.handler);
```

See the [Middleware](/middleware) section for more built-in options.

## A Complete Example

Let's build a simple REST API for managing tasks:

```typescript
import { MageApp } from "@mage/app";
import { cors } from "@mage/app/cors";
import { rateLimit } from "@mage/app/rate-limit";

const app = new MageApp();

// Middleware
app.use(cors());
app.use(rateLimit({ max: 100, windowMs: 60000 }));

// In-memory storage (use a database in production)
const tasks = new Map<string, { id: string; title: string; done: boolean }>();
let nextId = 1;

// Logging middleware
app.use((c, next) => {
  console.log(`${c.req.method} ${c.req.url.pathname}`);
  return next();
});

// List all tasks
app.get("/tasks", (c) => {
  const allTasks = Array.from(tasks.values());
  c.json(allTasks);
});

// Get a specific task
app.get("/tasks/:id", (c) => {
  const task = tasks.get(c.req.params.id);

  if (!task) {
    return c.notFound("Task not found");
  }

  c.json(task);
});

// Create a new task
app.post("/tasks", async (c) => {
  const body = await c.req.json();

  if (!body.title || typeof body.title !== "string") {
    return c.json({ error: "Title is required" }, 400);
  }

  const task = {
    id: String(nextId++),
    title: body.title,
    done: false,
  };

  tasks.set(task.id, task);
  c.json(task, 201);
});

// Update a task
app.patch("/tasks/:id", async (c) => {
  const task = tasks.get(c.req.params.id);

  if (!task) {
    return c.notFound("Task not found");
  }

  const body = await c.req.json();

  if (body.title !== undefined) {
    task.title = body.title;
  }
  if (body.done !== undefined) {
    task.done = body.done;
  }

  c.json(task);
});

// Delete a task
app.delete("/tasks/:id", (c) => {
  if (!tasks.has(c.req.params.id)) {
    return c.notFound("Task not found");
  }

  tasks.delete(c.req.params.id);
  c.empty(204);
});

Deno.serve({ port: 3000 }, app.handler);
```

Try it out:

```bash
# Create a task
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Mage"}'

# List tasks
curl http://localhost:3000/tasks

# Update a task
curl -X PATCH http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"done":true}'

# Delete a task
curl -X DELETE http://localhost:3000/tasks/1
```

## Error Handling

Mage provides a `MageError` class for throwing HTTP errors:

```typescript
import { MageApp, MageError } from "@mage/app";

const app = new MageApp();

app.get("/admin", (c) => {
  const isAdmin = c.req.header("x-admin") === "true";

  if (!isAdmin) {
    throw new MageError("Forbidden", 403);
  }

  c.text("Admin area");
});

Deno.serve(app.handler);
```

When you throw a `MageError`, Mage automatically sends an appropriate error
response. You can also use the context helper methods:

```typescript
app.get("/users/:id", (c) => {
  const user = findUser(c.req.params.id);

  if (!user) {
    return c.notFound("User not found");
  }

  c.json(user);
});
```

## Next Steps

You now know the fundamentals of building Mage applications! Here's what to
explore next:

- **[Core Concepts](/core-concepts)** - Deep dive into routing, middleware, and
  the context object
- **[Middleware](/middleware)** - Explore built-in middleware for security,
  validation, compression, and more
- **[Request Validation](/validation)** - Validate request data with Zod,
  Valibot, or ArkType
- **[Static Sites](/static-sites)** - Build documentation sites and blogs with
  the Pages module
- **[Deployment](/deployment)** - Deploy to Deno Deploy, Docker, or traditional
  servers

For complete API documentation, see the README files in each module or browse
the [API Reference](/api).
