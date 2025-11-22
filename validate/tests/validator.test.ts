import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { validator } from "../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";
import { z } from "zod";

const shopSchema = z.object({
  name: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      price: z.number(),
    }),
  ),
});

const personSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  middleNames: z.array(z.string()),
});

const dateSchema = z.object({
  year: z.string().refine((value) => value.length === 4),
  month: z.string().refine((value) => value.length === 2),
  day: z.string().refine((value) => value.length === 2),
});

const tagsSchema = z.object({
  name: z.string(),
  tags: z.array(z.string()),
});

const idSchema = z.object({
  id: z.string().uuid(),
});

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  // Single source - JSON
  const { validate: v1, valid: d1 } = validator({ json: shopSchema });
  server.app.post("/json", v1, (c) => {
    c.json(d1(c).json);
  });

  // Single source - Form
  const { validate: v2, valid: d2 } = validator({ form: personSchema });
  server.app.post("/form", v2, (c) => {
    c.json(d2(c).form);
  });

  // Single source - Params
  const { validate: v3, valid: d3 } = validator({ params: dateSchema });
  server.app.post("/params/:year/:month/:day", v3, (c) => {
    c.json(d3(c).params);
  });

  // Single source - Search
  const { validate: v4, valid: d4 } = validator({ search: dateSchema });
  server.app.post("/search", v4, (c) => {
    c.json(d4(c).search);
  });

  // Multi-value search params
  const { validate: v5, valid: d5 } = validator({ search: tagsSchema });
  server.app.post("/search-multi", v5, (c) => {
    c.json(d5(c).search);
  });

  // Multiple sources
  const { validate: v6, valid: d6 } = validator({
    params: idSchema,
    json: shopSchema,
  });
  server.app.post("/multi/:id", v6, (c) => {
    const { params, json } = d6(c);
    c.json({ id: params.id, shop: json });
  });

  // Multiple sources (params + json + search)
  // Note: Cannot test all 4 sources in single HTTP request (can't mix FormData and JSON body)
  const { validate: v7, valid: d7 } = validator({
    params: idSchema,
    json: shopSchema,
    search: tagsSchema,
  });
  server.app.post("/triple/:id", v7, (c) => {
    const { params, json, search } = d7(c);
    c.json({ params, json, search });
  });

  // With other middleware
  const { validate: v8, valid: d8 } = validator({ json: shopSchema });
  server.app.post(
    "/with-middleware",
    async (c, next) => {
      c.header("X-Test", "middleware");
      await next();
    },
    v8,
    (c) => {
      c.json(d8(c).json);
    },
  );

  // Destructured usage
  const { validate, valid } = validator({ json: shopSchema });
  server.app.post("/destructured", validate, (c) => {
    c.json(valid(c).json);
  });

  // Report errors
  const { validate: v9, valid: d9 } = validator(
    { json: shopSchema },
    { reportErrors: true },
  );
  server.app.post("/report", v9, (c) => {
    c.json(d9(c).json);
  });

  // Custom error handler
  const { validate: v10, valid: d10 } = validator(
    { json: shopSchema },
    {
      onError: (errors) => {
        return new Response(
          JSON.stringify({ custom: true, errorCount: errors.length }),
          { status: 400 },
        );
      },
    },
  );
  server.app.post("/custom-error", v10, (c) => {
    c.json(d10(c).json);
  });

  // Empty config
  const { validate: v11 } = validator({});
  server.app.post("/empty", v11, (c) => {
    c.json({ empty: true });
  });

  // Test malformed JSON handling
  const { validate: v12, valid: d12 } = validator({ json: shopSchema });
  server.app.post("/malformed-json", v12, (c) => {
    c.json(d12(c).json);
  });

  // Test valid() called without middleware
  const { valid: d13 } = validator({ json: shopSchema });
  server.app.post("/no-middleware", (c) => {
    try {
      d13(c);
      c.json({ error: "should have thrown" });
    } catch (error) {
      c.json({ error: (error as Error).message }, 500);
    }
  });

  // Test onError returning void (falls through to default handling)
  const { validate: v14, valid: d14 } = validator(
    { json: shopSchema },
    {
      onError: (_errors) => {
        // Return void - should fall through to default handling
      },
    },
  );
  server.app.post("/void-error", v14, (c) => {
    c.json(d14(c).json);
  });

  // Multiple validators on same route (test no collision)
  const { validate: v15, valid: d15 } = validator({
    search: z.object({ apiKey: z.string().min(1) }),
  });
  const { validate: v16, valid: d16 } = validator({
    json: shopSchema,
  });
  server.app.post("/multi-validator", v15, v16, (c) => {
    c.json({
      auth: d15(c).search,
      body: d16(c).json,
    });
  });

  // Validator reuse across multiple routes
  const { validate: v17, valid: d17 } = validator({ json: shopSchema });
  server.app.post("/reuse1", v17, (c) => {
    c.json({ route: "reuse1", data: d17(c).json });
  });
  server.app.post("/reuse2", v17, (c) => {
    c.json({ route: "reuse2", data: d17(c).json });
  });

  // Concurrent request handling (async delay)
  const { validate: v18, valid: d18 } = validator({ json: shopSchema });
  server.app.post("/concurrent", v18, async (c) => {
    // Simulate async work to test isolation
    await new Promise((resolve) => setTimeout(resolve, 50));
    c.json(d18(c).json);
  });

  // Detailed error accumulation with reportErrors
  const { validate: v19, valid: d19 } = validator(
    {
      params: idSchema,
      json: shopSchema,
    },
    { reportErrors: true },
  );
  server.app.post("/error-detail/:id", v19, (c) => {
    c.json(d19(c));
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("validator", () => {
  describe("single source - json", () => {
    it("should return 400 for invalid data", async () => {
      const response = await fetch(server.url("/json"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Shop",
          items: [
            {
              name: "Item",
              price: "10", // should be a number
            },
          ],
        }),
      });

      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Bad Request");
    });

    it("should return 200 for valid data", async () => {
      const response = await fetch(server.url("/json"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Shop",
          items: [
            {
              name: "Item",
              price: 10,
            },
          ],
        }),
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        name: "Shop",
        items: [
          {
            name: "Item",
            price: 10,
          },
        ],
      });
    });
  });

  describe("single source - form", () => {
    it("should return 400 for invalid data", async () => {
      const params = new URLSearchParams();
      params.append("firstName", "John");
      params.append("lastName", "Doe");
      params.append("middleNames", "Jane");

      const response = await fetch(server.url("/form"), {
        method: "POST",
        body: params,
      });

      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Bad Request");
    });

    it("should return 200 for valid data", async () => {
      const params = new URLSearchParams();
      params.append("firstName", "John");
      params.append("lastName", "Doe");
      params.append("middleNames", "Jane");
      params.append("middleNames", "Alice");

      const response = await fetch(server.url("/form"), {
        method: "POST",
        body: params,
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        firstName: "John",
        lastName: "Doe",
        middleNames: ["Jane", "Alice"],
      });
    });
  });

  describe("single source - params", () => {
    it("should return 400 for invalid data", async () => {
      const response = await fetch(server.url("/params/21/01/01"), {
        method: "POST",
      });

      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Bad Request");
    });

    it("should return 200 for valid data", async () => {
      const response = await fetch(server.url("/params/2021/01/01"), {
        method: "POST",
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        year: "2021",
        month: "01",
        day: "01",
      });
    });
  });

  describe("single source - search", () => {
    it("should return 400 for invalid data", async () => {
      const response = await fetch(
        server.url("/search?year=21&month=01&day=01"),
        {
          method: "POST",
        },
      );

      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Bad Request");
    });

    it("should return 200 for valid data", async () => {
      const response = await fetch(
        server.url("/search?year=2021&month=01&day=01"),
        {
          method: "POST",
        },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        year: "2021",
        month: "01",
        day: "01",
      });
    });

    it("should handle multiple values for same field", async () => {
      const response = await fetch(
        server.url("/search-multi?name=product&tags=a&tags=b"),
        {
          method: "POST",
        },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        name: "product",
        tags: ["a", "b"],
      });
    });
  });

  describe("multiple sources", () => {
    it("should validate params + json", async () => {
      const response = await fetch(
        server.url("/multi/550e8400-e29b-41d4-a716-446655440000"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Shop",
            items: [{ name: "Item", price: 10 }],
          }),
        },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        id: "550e8400-e29b-41d4-a716-446655440000",
        shop: {
          name: "Shop",
          items: [{ name: "Item", price: 10 }],
        },
      });
    });

    it("should validate params + json + search (three sources)", async () => {
      const response = await fetch(
        server.url(
          "/triple/550e8400-e29b-41d4-a716-446655440000?name=product&tags=a&tags=b",
        ),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Shop",
            items: [{ name: "Item", price: 10 }],
          }),
        },
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.params.id).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(result.json.name).toBe("Shop");
      expect(result.search.name).toBe("product");
      expect(result.search.tags).toEqual(["a", "b"]);
    });

    it("should accumulate errors from multiple failed sources", async () => {
      const response = await fetch(
        server.url("/multi/invalid-uuid"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Shop",
            items: [{ name: "Item", price: "invalid" }],
          }),
        },
      );

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toBe("Bad Request");
    });

    it("should report detailed errors from all failed sources with reportErrors", async () => {
      const response = await fetch(
        server.url("/error-detail/invalid-uuid"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Shop",
            items: [{ name: "Item", price: "invalid" }],
          }),
        },
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.errors).toBeInstanceOf(Array);
      expect(body.errors.length).toBe(2);

      // Check both sources present in errors
      const sources = body.errors.map((e: { source: string }) => e.source);
      expect(sources).toContain("params");
      expect(sources).toContain("json");

      // Verify each error has issues
      body.errors.forEach((error: { issues: unknown[] }) => {
        expect(error.issues).toBeInstanceOf(Array);
        expect(error.issues.length).toBeGreaterThan(0);
      });
    });

    it("should succeed only if all sources are valid", async () => {
      // Valid params, invalid json
      const response1 = await fetch(
        server.url("/multi/550e8400-e29b-41d4-a716-446655440000"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Shop",
            items: [{ name: "Item", price: "invalid" }],
          }),
        },
      );
      expect(response1.status).toBe(400);
      await response1.text(); // Consume body

      // Invalid params, valid json
      const response2 = await fetch(
        server.url("/multi/not-a-uuid"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Shop",
            items: [{ name: "Item", price: 10 }],
          }),
        },
      );
      expect(response2.status).toBe(400);
      await response2.text(); // Consume body
    });
  });

  describe("middleware composition", () => {
    it("should work with other middleware", async () => {
      const response = await fetch(server.url("/with-middleware"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Shop",
          items: [{ name: "Item", price: 10 }],
        }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Test")).toBe("middleware");
      expect(await response.json()).toEqual({
        name: "Shop",
        items: [{ name: "Item", price: 10 }],
      });
    });
  });

  describe("destructured usage", () => {
    it("should work when destructured", async () => {
      const response = await fetch(server.url("/destructured"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Shop",
          items: [{ name: "Item", price: 10 }],
        }),
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        name: "Shop",
        items: [{ name: "Item", price: 10 }],
      });
    });
  });

  describe("error handling", () => {
    it("should report detailed errors when reportErrors: true", async () => {
      const response = await fetch(server.url("/report"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Shop",
          items: [{ name: "Item", price: "10" }],
        }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty("errors");
      expect(body.errors).toBeInstanceOf(Array);
      expect(body.errors.length).toBe(1);
      expect(body.errors[0]).toHaveProperty("source");
      expect(body.errors[0].source).toBe("json");
      expect(body.errors[0]).toHaveProperty("issues");
      expect(Array.isArray(body.errors[0].issues)).toBe(true);
    });

    it("should call custom error handler", async () => {
      const response = await fetch(server.url("/custom-error"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Shop",
          items: [{ name: "Item", price: "10" }],
        }),
      });

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        custom: true,
        errorCount: 1,
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty config as no-op", async () => {
      const response = await fetch(server.url("/empty"), {
        method: "POST",
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ empty: true });
    });

    it("should throw error when valid() called without middleware", async () => {
      const response = await fetch(server.url("/no-middleware"), {
        method: "POST",
      });

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error:
          "[Validator] No validation data found - did you forget to add the validator middleware?",
      });
    });

    it("should handle three or more values for same search field", async () => {
      const response = await fetch(
        server.url("/search-multi?name=product&tags=a&tags=b&tags=c"),
        {
          method: "POST",
        },
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        name: "product",
        tags: ["a", "b", "c"],
      });
    });

    it("should handle three or more values for same form field", async () => {
      const params = new URLSearchParams();
      params.append("firstName", "John");
      params.append("lastName", "Doe");
      params.append("middleNames", "Jane");
      params.append("middleNames", "Alice");
      params.append("middleNames", "Bob");

      const response = await fetch(server.url("/form"), {
        method: "POST",
        body: params,
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        firstName: "John",
        lastName: "Doe",
        middleNames: ["Jane", "Alice", "Bob"],
      });
    });

    it("should filter out File objects from form data", async () => {
      const formData = new FormData();
      formData.append("firstName", "John");
      formData.append("lastName", "Doe");
      formData.append("middleNames", "Jane");
      formData.append("middleNames", "Alice");
      // Add a File object that should be filtered out
      formData.append(
        "file",
        new File(["content"], "test.txt", { type: "text/plain" }),
      );

      const response = await fetch(server.url("/form"), {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toEqual({
        firstName: "John",
        lastName: "Doe",
        middleNames: ["Jane", "Alice"],
      });
      // File field should not be present
      expect(result).not.toHaveProperty("file");
    });

    it("should use default error handling when onError returns void", async () => {
      const response = await fetch(server.url("/void-error"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Shop",
          items: [{ name: "Item", price: "10" }],
        }),
      });

      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Bad Request");
    });

    it("should handle malformed JSON as extraction failure", async () => {
      const response = await fetch(server.url("/malformed-json"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{ invalid json }",
      });

      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Bad Request");
    });
  });

  describe("multiple validators", () => {
    it("should support multiple validators on same route without collision", async () => {
      const response = await fetch(
        server.url("/multi-validator?apiKey=test-key-123"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Shop",
            items: [{ name: "Item", price: 10 }],
          }),
        },
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.auth.apiKey).toBe("test-key-123");
      expect(data.body.name).toBe("Shop");
      expect(data.body.items).toHaveLength(1);
    });

    it("should fail if first validator fails", async () => {
      const response = await fetch(
        server.url("/multi-validator"), // Missing apiKey
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Shop",
            items: [{ name: "Item", price: 10 }],
          }),
        },
      );

      expect(response.status).toBe(400);
      await response.text(); // Consume body
    });

    it("should fail if second validator fails", async () => {
      const response = await fetch(
        server.url("/multi-validator?apiKey=test-key-123"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Shop",
            items: [{ name: "Item", price: "invalid" }], // Invalid price
          }),
        },
      );

      expect(response.status).toBe(400);
      await response.text(); // Consume body
    });
  });

  describe("validator reuse", () => {
    it("should allow same validator instance across multiple routes", async () => {
      const shopData = {
        name: "Shop",
        items: [{ name: "Item", price: 10 }],
      };

      // Test first route
      const response1 = await fetch(server.url("/reuse1"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shopData),
      });

      expect(response1.status).toBe(200);
      const data1 = await response1.json();
      expect(data1.route).toBe("reuse1");
      expect(data1.data).toEqual(shopData);

      // Test second route
      const response2 = await fetch(server.url("/reuse2"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shopData),
      });

      expect(response2.status).toBe(200);
      const data2 = await response2.json();
      expect(data2.route).toBe("reuse2");
      expect(data2.data).toEqual(shopData);
    });
  });

  describe("concurrent requests", () => {
    it("should isolate validation data between concurrent requests", async () => {
      // Send two concurrent requests with different data
      const [response1, response2] = await Promise.all([
        fetch(server.url("/concurrent"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Shop1",
            items: [{ name: "Item1", price: 10 }],
          }),
        }),
        fetch(server.url("/concurrent"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Shop2",
            items: [{ name: "Item2", price: 20 }],
          }),
        }),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const data1 = await response1.json();
      const data2 = await response2.json();

      // Each request should get its own data (no cross-contamination)
      expect(data1.name).toBe("Shop1");
      expect(data1.items[0].name).toBe("Item1");
      expect(data1.items[0].price).toBe(10);

      expect(data2.name).toBe("Shop2");
      expect(data2.items[0].name).toBe("Item2");
      expect(data2.items[0].price).toBe(20);
    });
  });
});
