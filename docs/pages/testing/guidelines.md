---
title: "Testing Mage Applications"
description: "Black-box HTTP testing patterns for Mage applications"
---

# Testing Mage Applications

Testing Mage applications is straightforward: spin up an ephemeral HTTP server, make requests with `fetch`, and assert on responses. No special testing utilities needed—it's just HTTP API testing.

## Quick Start

Here's the basic pattern:

```typescript
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageApp } from "@mage/app";

let server: Deno.HttpServer;
let app: MageApp;
let baseUrl: string;

beforeAll(() => {
  app = new MageApp();

  app.get("/hello", (c) => {
    c.text("Hello, World!");
  });

  server = Deno.serve({ port: 0 }, app.handler);
  baseUrl = `http://${server.addr.hostname}:${server.addr.port}`;
});

afterAll(async () => {
  await server.shutdown();
  await server.finished;
});

describe("hello endpoint", () => {
  it("should return greeting", async () => {
    const response = await fetch(`${baseUrl}/hello`);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Hello, World!");
  });
});
```

Run tests with:

```bash
deno test --allow-all
```

## Test Server Setup

### Use Port 0

Always use `port: 0` when starting test servers. Deno assigns an available port automatically, preventing "address already in use" errors in CI or when running tests in parallel:

```typescript
server = Deno.serve({ port: 0 }, app.handler);
```

### Create a Helper Class

For cleaner tests, create a reusable test server helper:

```typescript
export class MageTestServer {
  private _app: MageApp = new MageApp();
  private _server: Deno.HttpServer<Deno.NetAddr> | undefined;

  public get app() {
    return this._app;
  }

  start(port?: number) {
    this._server = Deno.serve({ port: port ?? 0 }, this._app.handler);
  }

  url(path: string) {
    return new URL(
      path,
      `http://${this._server?.addr.hostname}:${this._server?.addr.port}`
    );
  }

  async stop() {
    if (this._server) {
      await this._server.shutdown();
      await this._server.finished;
    }
  }
}
```

Usage:

```typescript
import { MageTestServer } from "./test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/hello", (c) => {
    c.text("Hello, World!");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

it("should return greeting", async () => {
  const response = await fetch(server.url("/hello"));
  expect(await response.text()).toBe("Hello, World!");
});
```

## Common Testing Scenarios

### Different HTTP Methods

```typescript
beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/users", (c) => {
    c.json([{ id: 1, name: "Alice" }]);
  });

  server.app.post("/users", async (c) => {
    const user = await c.json();
    c.json({ id: 2, ...user });
  });

  server.app.delete("/users/:id", (c) => {
    c.status(204);
  });

  server.start();
});

it("should list users", async () => {
  const response = await fetch(server.url("/users"));
  const users = await response.json();

  expect(response.status).toBe(200);
  expect(users).toHaveLength(1);
});

it("should create user", async () => {
  const response = await fetch(server.url("/users"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Bob" }),
  });

  const user = await response.json();
  expect(user.name).toBe("Bob");
});

it("should delete user", async () => {
  const response = await fetch(server.url("/users/1"), {
    method: "DELETE",
  });

  expect(response.status).toBe(204);
  await response.text(); // Consume body even if empty
});
```

### Request Bodies

**JSON:**

```typescript
it("should handle JSON body", async () => {
  const response = await fetch(server.url("/api/data"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: "value" }),
  });

  const data = await response.json();
  expect(data.key).toBe("value");
});
```

**FormData:**

```typescript
it("should handle form data", async () => {
  const formData = new FormData();
  formData.append("name", "Alice");
  formData.append("file", new Blob(["content"]), "test.txt");

  const response = await fetch(server.url("/upload"), {
    method: "POST",
    body: formData,
  });

  expect(response.status).toBe(200);
  await response.text();
});
```

### Middleware

Test middleware by verifying its side effects (headers, context values, response modifications):

```typescript
import type { MageMiddleware } from "@mage/app";

const requestCounter: MageMiddleware = async (c, next) => {
  const count = c.get<number>("count") ?? 0;
  c.set("count", count + 1);
  await next();
};

beforeAll(() => {
  server = new MageTestServer();

  // Apply middleware globally
  server.app.use(requestCounter);

  server.app.get("/count", (c) => {
    c.json({ count: c.get<number>("count") });
  });

  server.start();
});

it("should increment count via middleware", async () => {
  const response = await fetch(server.url("/count"));
  const data = await response.json();

  expect(data.count).toBe(1);
});
```

**Middleware chaining:**

```typescript
const addHeader: MageMiddleware = async (c, next) => {
  await next();
  c.header("X-Custom", "value");
};

const requireAuth: MageMiddleware = async (c, next) => {
  if (!c.header("Authorization")) {
    c.status(401);
    c.text("Unauthorized");
    return;
  }
  await next();
};

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/public", addHeader, (c) => {
    c.text("public");
  });

  server.app.get("/protected", requireAuth, (c) => {
    c.text("protected");
  });

  server.start();
});

it("should add custom header", async () => {
  const response = await fetch(server.url("/public"));

  expect(response.headers.get("X-Custom")).toBe("value");
  await response.text();
});

it("should require auth", async () => {
  const response = await fetch(server.url("/protected"));

  expect(response.status).toBe(401);
  await response.text();
});

it("should allow authenticated request", async () => {
  const response = await fetch(server.url("/protected"), {
    headers: { Authorization: "Bearer token" },
  });

  expect(response.status).toBe(200);
  expect(await response.text()).toBe("protected");
});
```

### Input Validation

**Valid input:**

```typescript
import { validator } from "@mage/validate";
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

beforeAll(() => {
  server = new MageTestServer();

  server.app.post("/users", validator("json", userSchema), (c) => {
    const user = c.validated.json;
    c.json({ id: 1, ...user });
  });

  server.start();
});

it("should accept valid user", async () => {
  const response = await fetch(server.url("/users"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Alice",
      email: "alice@example.com",
    }),
  });

  expect(response.status).toBe(200);
  const user = await response.json();
  expect(user.name).toBe("Alice");
});
```

**Invalid input:**

```typescript
it("should reject invalid user", async () => {
  const response = await fetch(server.url("/users"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "",
      email: "not-an-email",
    }),
  });

  expect(response.status).toBe(400);
  const error = await response.json();
  expect(error.errors).toBeDefined();
});
```

**Multiple validation sources:**

```typescript
const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  status: z.enum(["active", "inactive"]),
});

beforeAll(() => {
  server = new MageTestServer();

  server.app.patch(
    "/users/:id",
    validator("params", paramsSchema),
    validator("json", bodySchema),
    (c) => {
      const { id } = c.validated.params;
      const { status } = c.validated.json;
      c.json({ id, status });
    }
  );

  server.start();
});

it("should validate params and body", async () => {
  const response = await fetch(
    server.url("/users/550e8400-e29b-41d4-a716-446655440000"),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    }
  );

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.id).toBe("550e8400-e29b-41d4-a716-446655440000");
  expect(data.status).toBe("active");
});
```

## Resource Management

**Critical:** Always consume response bodies to prevent resource leaks. Deno tracks open resources and will fail tests if bodies aren't consumed.

**Correct patterns:**

```typescript
// Reading the body
const response = await fetch(url);
expect(response.status).toBe(200);
await response.text(); // ✅ Body consumed

// Or cancel if you don't need the body
const response = await fetch(url);
expect(response.headers.get("Content-Type")).toBe("application/json");
await response.body?.cancel(); // ✅ Body cancelled

// For concurrent requests
const [response1, response2] = await Promise.all([fetch(url1), fetch(url2)]);
await Promise.all([response1, response2].map((r) => r.text())); // ✅ All consumed
```

**Common mistake:**

```typescript
// ❌ BAD: Body not consumed
it("should return 200", async () => {
  const response = await fetch(url);
  expect(response.status).toBe(200);
  // Missing: await response.text()
});
```

## Cleanup

Always clean up servers and temporary resources in `afterAll`:

**Server shutdown:**

```typescript
afterAll(async () => {
  await server.shutdown();
  await server.finished; // Wait for server to fully stop
});
```

**Temporary files:**

```typescript
let tempFile: string;

beforeAll(async () => {
  tempFile = await Deno.makeTempFile();
  await Deno.writeTextFile(tempFile, "test content");

  server = new MageTestServer();
  server.app.get("/file", async (c) => {
    const content = await Deno.readTextFile(tempFile);
    c.text(content);
  });
  server.start();
});

afterAll(async () => {
  await server.stop();
  await Deno.remove(tempFile); // Clean up temp file
});
```

**Temporary directories:**

```typescript
let tempDir: string;

beforeAll(async () => {
  tempDir = await Deno.makeTempDir();
  // ... setup
  server.start();
});

afterAll(async () => {
  await server.stop();
  await Deno.remove(tempDir, { recursive: true }); // Clean up recursively
});
```

## Summary

Testing Mage applications follows standard HTTP API testing patterns:

1. **Setup:** Spin up ephemeral server with `port: 0`
2. **Test:** Make requests with `fetch` and assert on responses
3. **Cleanup:** Always consume response bodies and shut down servers

That's it. No magic, no special utilities—just HTTP testing with clean resource management.
