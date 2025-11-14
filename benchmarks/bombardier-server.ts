/**
 * Simple HTTP server for bombardier benchmarking
 *
 * This matches the test setup used by Hono and other frameworks:
 * - Simple text response
 * - Routing with path parameter
 * - Minimal middleware
 *
 * Run with: deno run --allow-net benchmarks/bombardier-server.ts
 * Test with: bombardier --fasthttp -d 10s -c 100 http://localhost:8000/user/lookup/username/foo
 */

import { MageApp } from "../app/mod.ts";

const app = new MageApp();

// Simple text response (baseline)
app.get("/", (c) => {
  c.text("Hello, Bench!");
});

// Route with path parameter (like Hono's official benchmark)
app.get("/user/lookup/username/:username", (c) => {
  const username = c.req.params.username;
  c.text(`User: ${username}`);
});

// JSON response
app.get("/json", (c) => {
  c.json({ message: "Hello, Bench!" });
});

const PORT = 8000;

console.log(`Mage benchmark server running on http://localhost:${PORT}`);
console.log("");
console.log("Test with:");
console.log(`  bombardier --fasthttp -d 10s -c 100 http://localhost:${PORT}/`);
console.log(
  `  bombardier --fasthttp -d 10s -c 100 http://localhost:${PORT}/user/lookup/username/foo`,
);
console.log(
  `  bombardier --fasthttp -d 10s -c 100 http://localhost:${PORT}/json`,
);

Deno.serve({ port: PORT }, app.handler);
