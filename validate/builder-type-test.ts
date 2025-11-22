/**
 * Type test file - verifies that builder API and type inference works correctly.
 * This file should typecheck without errors.
 */

import { MageApp } from "../app/mod.ts";
import { z } from "zod";

const app = new MageApp();

// Define schemas
const paramsSchema = z.object({ id: z.string().uuid() });
const jsonSchema = z.object({ name: z.string(), email: z.string().email() });
const searchSchema = z.object({ notify: z.boolean().optional() });

// Test 1: Simple routes (no validation) - unchanged API
app.get("/health", (c) => c.text("OK"));
app.post("/webhook", (c) => c.json({ ok: true }));

// Test 2: Single source validation
app.post("/login")
  .validate({ json: jsonSchema })
  .handle((c) => {
    const data = c.valid.json;
    // Type should be: { name: string; email: string }
    const _name: string = data.name;
    const _email: string = data.email;

    c.json({ success: true });
  });

// Test 3: Multiple source validation
app.post("/users/:id")
  .validate({
    params: paramsSchema,
    json: jsonSchema,
    search: searchSchema,
  })
  .handle((c) => {
    const { id } = c.valid.params;
    const { name, email } = c.valid.json;
    const { notify } = c.valid.search;

    // Types should be properly inferred
    const _id: string = id;
    const _name: string = name;
    const _email: string = email;
    const _notify: boolean | undefined = notify;

    c.json({ id, name, email, notify });
  });

// Test 4: With middleware
app.post("/protected")
  .validate({ json: jsonSchema })
  .handle(
    async (_c, next) => {
      // Auth middleware
      await next();
    },
    async (_c, next) => {
      // Logging middleware
      await next();
    },
    (c) => {
      c.valid.json; // Still typed!
      c.json({ success: true });
    },
  );

// Test 5: Empty config (no-op)
app.post("/test")
  .validate({})
  .handle((c) => {
    c.json({ success: true });
  });

// Test 6: Error reporting
app.post("/users")
  .validate(
    { json: jsonSchema },
    { reportErrors: true },
  )
  .handle((c) => {
    c.json(c.valid.json);
  });

console.log("Builder type test file typechecked successfully!");
