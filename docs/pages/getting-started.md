---
title: "Getting Started"
description: "Build your first Mage application"
layout: "article"
---

# Getting Started

This guide walks you through building your first Mage application. We'll create
a simple task API to demonstrate core concepts like routing, middleware, and
request handling.

## Prerequisites

Make sure you've [installed Mage](/installation) first.

## Create Your Application

Create a new file `main.ts`:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

// We'll add routes here

Deno.serve(app.handler);
```

## Adding Routes

Let's start with a simple GET route that returns a list of tasks:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();

const tasks = [
  { id: 1, title: "Learn Mage", completed: false },
  { id: 2, title: "Build an API", completed: false },
];

app.get("/tasks", (c) => {
  return c.json(tasks);
});

Deno.serve(app.handler);
```

Run it:

```bash
deno run --allow-net main.ts
```

Visit [http://localhost:8000/tasks](http://localhost:8000/tasks) and you'll see
your tasks as JSON.

## Understanding Context

Every route handler receives a `MageContext` object (typically named `c`). This
gives you access to:

- `c.req` - The request (headers, body, params, etc.)
- `c.res` - The response (set headers, status, etc.)
- Helper methods - `c.json()`, `c.text()`, `c.html()`, `c.redirect()`, etc.

## Route Parameters

Add a route to get a specific task by ID:

```typescript
app.get("/tasks/:id", (c) => {
  const id = parseInt(c.req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return c.json({ error: "Task not found" }, 404);
  }

  return c.json(task);
});
```

Try [http://localhost:8000/tasks/1](http://localhost:8000/tasks/1) to get the
first task.

## Handling Request Bodies

Let's add a POST route to create tasks:

```typescript
app.post("/tasks", async (c) => {
  const body = await c.req.json();

  const newTask = {
    id: tasks.length + 1,
    title: body.title,
    completed: false,
  };

  tasks.push(newTask);

  return c.json(newTask, 201);
});
```

Test it with curl:

```bash
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Deploy to production"}'
```

## Using Middleware

Middleware runs before your route handlers. Let's add CORS support and body size
limiting:

```typescript
import { MageApp } from "@mage/app";
import { cors } from "@mage/cors";
import { bodySize } from "@mage/body-size";

const app = new MageApp();

// Global middleware - runs on every request
app.use(cors({ origins: "*" }));
app.use(bodySize({ maxSize: 1024 * 1024 })); // 1MB limit

// Your routes here...
```

You can also apply middleware to specific routes:

```typescript
import { requestId } from "@mage/request-id";

app.get("/tasks", requestId(), (c) => {
  console.log(`Request ID: ${c.get("requestId")}`);
  return c.json(tasks);
});
```

## Error Handling

Use `MageError` to throw HTTP errors:

```typescript
import { MageApp, MageError } from "@mage/app";

app.delete("/tasks/:id", (c) => {
  const id = parseInt(c.req.params.id);
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    throw new MageError("Task not found", 404);
  }

  tasks.splice(index, 1);
  return c.empty(204);
});
```

For comprehensive error handling patterns including error handler middleware,
see [Error Handling](/core/error-handling).

## Complete Example

Here's the full application:

```typescript
import { MageApp, MageError } from "@mage/app";
import { cors } from "@mage/cors";
import { bodySize } from "@mage/body-size";

const app = new MageApp();

// Middleware
app.use(cors({ origins: "*" }));
app.use(bodySize({ maxSize: 1024 * 1024 }));

// In-memory storage
const tasks = [
  { id: 1, title: "Learn Mage", completed: false },
  { id: 2, title: "Build an API", completed: false },
];

// Routes
app.get("/tasks", (c) => {
  return c.json(tasks);
});

app.get("/tasks/:id", (c) => {
  const id = parseInt(c.req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    throw new MageError("Task not found", 404);
  }

  return c.json(task);
});

app.post("/tasks", async (c) => {
  const body = await c.req.json();

  const newTask = {
    id: tasks.length + 1,
    title: body.title,
    completed: false,
  };

  tasks.push(newTask);
  return c.json(newTask, 201);
});

app.delete("/tasks/:id", (c) => {
  const id = parseInt(c.req.params.id);
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    throw new MageError("Task not found", 404);
  }

  tasks.splice(index, 1);
  return c.empty(204);
});

Deno.serve(app.handler);
```

## Next Steps

You've learned the basics! Here's what to explore next:

- [Philosophy](/philosophy) - Understand Mage's design principles
- [Core Concepts](#) - Deep dive into MageApp, MageContext, and more
- [Middleware](#) - Explore all available middleware
- [Validation](#) - Add schema validation with Zod or Valibot
- [Deployment](#) - Deploy to Deno Deploy, Cloudflare Workers, or AWS Lambda
