---
title: "Getting Started"
description: "Build your first Mage application with routing, middleware, and more"
---

# Getting Started

This guide will walk you through building your first Mage application with
routing, middleware, and request handling.

## Create Your Application

Start by creating a new Mage application:

```typescript
import { MageApp } from "@mage/app";

const app = new MageApp();
```

## Add Routes

Define routes using HTTP method helpers:

```typescript
// GET route
app.get("/", (c) => {
  c.text("Welcome to Mage!");
});

// POST route
app.post("/api/users", (c) => {
  c.json({ message: "User created" }, 201);
});

// Route with parameters
app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  c.json({ userId: id });
});
```

## Use Middleware

Mage includes built-in middleware for common tasks:

```typescript
import { compression } from "@mage/app/compression";
import { cors } from "@mage/app/cors";
import { logs } from "@mage/app/logs";

// Apply middleware globally
app.use(logs());
app.use(compression());
app.use(cors());
```

## Handle Requests

The context object (`c`) provides methods for working with requests and
responses:

```typescript
app.get("/hello", (c) => {
  // Get query parameters
  const name = c.req.query("name") ?? "World";

  // Return text response
  c.text(`Hello, ${name}!`);
});

app.post("/data", async (c) => {
  // Parse JSON body
  const body = await c.req.json();

  // Return JSON response
  c.json({ received: body });
});
```

## Start the Server

Finally, start your server:

```typescript
Deno.serve({ port: 3000 }, app.handler);
```

## Complete Example

Here's a complete example putting it all together:

```typescript
import { MageApp } from "@mage/app";
import { logs } from "@mage/app/logs";

const app = new MageApp();

// Middleware
app.use(logs());

// Routes
app.get("/", (c) => {
  c.text("Welcome to Mage!");
});

app.get("/hello/:name", (c) => {
  const name = c.req.param("name");
  c.json({ message: `Hello, ${name}!` });
});

// Start server
Deno.serve({ port: 3000 }, app.handler);
```

Run your application:

```bash
deno run --allow-net main.ts
```

## Next Steps

- Explore built-in middleware modules
- Learn about request validation
- Add static file serving
- Deploy your application
