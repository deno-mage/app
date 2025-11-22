import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
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

  // Single source validation - JSON
  server.app.post("/json")
    .validate({ json: shopSchema })
    .handle((c) => {
      c.json(c.valid.json);
    });

  // Single source validation - Form
  server.app.post("/form")
    .validate({ form: personSchema })
    .handle((c) => {
      c.json(c.valid.form);
    });

  // Single source validation - Params
  server.app.post("/params/:year/:month/:day")
    .validate({ params: dateSchema })
    .handle((c) => {
      c.json(c.valid.params);
    });

  // Single source validation - Search params
  server.app.post("/search")
    .validate({ search: dateSchema })
    .handle((c) => {
      c.json(c.valid.search);
    });

  // Multi-value search params
  server.app.post("/search-multi")
    .validate({ search: tagsSchema })
    .handle((c) => {
      c.json(c.valid.search);
    });

  // Multiple source validation
  server.app.post("/multi/:id")
    .validate({
      params: idSchema,
      json: shopSchema,
    })
    .handle((c) => {
      c.json({
        id: c.valid.params.id,
        shop: c.valid.json,
      });
    });

  // All four sources
  server.app.post("/all/:id")
    .validate({
      params: idSchema,
      json: shopSchema,
      search: tagsSchema,
      form: personSchema,
    })
    .handle((c) => {
      c.json({
        params: c.valid.params,
        json: c.valid.json,
        search: c.valid.search,
        form: c.valid.form,
      });
    });

  // With middleware
  server.app.post("/with-middleware")
    .validate({ json: shopSchema })
    .handle(
      async (c, next) => {
        // Middleware 1
        c.header("X-Test", "middleware");
        await next();
      },
      (c) => {
        c.json(c.valid.json);
      },
    );

  // Report errors
  server.app.post("/report")
    .validate(
      { json: shopSchema },
      { reportErrors: true },
    )
    .handle((c) => {
      c.json(c.valid.json);
    });

  // Custom error handler
  server.app.post("/custom-error")
    .validate(
      { json: shopSchema },
      {
        onError: (errors) => {
          return new Response(
            JSON.stringify({ custom: true, errorCount: errors.length }),
            { status: 400 },
          );
        },
      },
    )
    .handle((c) => {
      c.json(c.valid.json);
    });

  // Empty config
  server.app.post("/empty")
    .validate({})
    .handle((c) => {
      c.json({ empty: true });
    });

  // Invalid source (for error testing)
  server.app.post("/invalid")
    .validate({
      invalid: shopSchema,
    } as Record<string, unknown>)
    .handle(() => {
      // Should not reach here
    });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("RouteBuilder Validation", () => {
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

    it("should handle 3+ occurrences of same field", async () => {
      const params = new URLSearchParams();
      params.append("firstName", "John");
      params.append("lastName", "Doe");
      params.append("middleNames", "Jane");
      params.append("middleNames", "Alice");
      params.append("middleNames", "Marie");

      const response = await fetch(server.url("/form"), {
        method: "POST",
        body: params,
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        firstName: "John",
        lastName: "Doe",
        middleNames: ["Jane", "Alice", "Marie"],
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

    it("should handle 3+ occurrences of same field", async () => {
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

    it("should only succeed if all sources valid", async () => {
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
      await response1.text(); // Consume response body

      // Invalid params, valid json
      const response2 = await fetch(
        server.url("/multi/invalid"),
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
      await response2.text(); // Consume response body
    });
  });

  describe("middleware support", () => {
    it("should work with middleware", async () => {
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
      expect(body.errors[0]).toHaveProperty("source");
      expect(body.errors[0].source).toBe("json");
      expect(body.errors[0]).toHaveProperty("issues");
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

    it("should handle extraction errors (invalid JSON)", async () => {
      const response = await fetch(server.url("/json"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "invalid json",
      });

      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Bad Request");
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

    it("should throw on invalid source", async () => {
      const response = await fetch(server.url("/invalid"), {
        method: "POST",
      });

      expect(response.status).toBe(500);
      expect(await response.text()).toBe("Internal Server Error");
    });
  });
});
