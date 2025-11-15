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
import { compression } from "../compression/mod.ts";

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

// Dynamic content benchmarks - simulates API responses with lorem ipsum
// This represents the actual use case for compression middleware:
// - User-specific data that can't be cached
// - API responses generated on-demand
// - SSR HTML that varies per request

const LOREM_IPSUM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ";

// Generate ~10KB of lorem ipsum text (realistic API response size)
const generateLoremText = (sizeKB: number): string => {
  const repetitions = Math.ceil((sizeKB * 1024) / LOREM_IPSUM.length);
  return LOREM_IPSUM.repeat(repetitions);
};

// Small response (~10KB) - uncompressed
app.get("/api/small", (c) => {
  const text = generateLoremText(10);
  c.text(text);
});

// Small response (~10KB) - with compression
app.get("/api/small-compressed", compression(), (c) => {
  const text = generateLoremText(10);
  c.text(text);
});

// Large response (~100KB) - uncompressed
app.get("/api/large", (c) => {
  const text = generateLoremText(100);
  c.text(text);
});

// Large response (~100KB) - with compression
app.get("/api/large-compressed", compression(), (c) => {
  const text = generateLoremText(100);
  c.text(text);
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
console.log(
  `  bombardier --fasthttp -d 10s -c 100 http://localhost:${PORT}/api/small`,
);
console.log(
  `  bombardier --fasthttp -d 10s -c 100 -H "Accept-Encoding: gzip" http://localhost:${PORT}/api/small-compressed`,
);
console.log(
  `  bombardier --fasthttp -d 10s -c 100 http://localhost:${PORT}/api/large`,
);
console.log(
  `  bombardier --fasthttp -d 10s -c 100 -H "Accept-Encoding: gzip" http://localhost:${PORT}/api/large-compressed`,
);

Deno.serve({ port: PORT }, app.handler);
