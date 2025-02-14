import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { useValidate } from "../mod.ts";
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

type Shop = z.infer<typeof shopSchema>;

const personSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  middleNames: z.array(z.string()),
});

type Person = z.infer<typeof personSchema>;

const dateSchema = z.object({
  year: z.string().refine((value) => value.length === 4),
  month: z.string().refine((value) => value.length === 2),
  day: z.string().refine((value) => value.length === 2),
});

type Date = z.infer<typeof dateSchema>;

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.post("/json", useValidate("json", shopSchema), (c) => {
    c.json(c.req.valid<Shop>("json"));
  });

  server.app.post("/form", useValidate("form", personSchema), (c) => {
    c.json(c.req.valid<Person>("form"));
  });

  server.app.post(
    "/params/:year/:month/:day",
    useValidate("params", dateSchema),
    (c) => {
      c.json(c.req.valid<Date>("params"));
    },
  );

  server.app.post(
    "/search-params",
    useValidate("search-params", dateSchema),
    (c) => {
      c.json(c.req.valid<Date>("search-params"));
    },
  );

  server.app.post(
    "/report",
    useValidate("json", shopSchema, { reportErrors: true }),
    (c) => {
      c.json(c.req.valid("json"));
    },
  );

  server.app.post(
    "/invalid",
    useValidate(
      "invalid" as unknown as "json" | "form" | "params" | "search-params",
      shopSchema,
    ),
    () => {
      // This route should not be reached
    },
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("middleware - use validate", () => {
  describe("json", () => {
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

  describe("form", () => {
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

  describe("params", () => {
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

  describe("search-params", () => {
    it("should return 400 for invalid data", async () => {
      const response = await fetch(
        server.url("/search-params?year=21&month=01&day=01"),
        {
          method: "POST",
        },
      );

      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Bad Request");
    });

    it("should return 200 for valid data", async () => {
      const response = await fetch(
        server.url("/search-params?year=2021&month=01&day=01"),
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
  });

  describe("report errors", () => {
    it("should return 400 with errors", async () => {
      const response = await fetch(server.url("/report"), {
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
      expect(await response.json()).toEqual([
        {
          code: "invalid_type",
          expected: "number",
          message: "Expected number, received string",
          path: ["items", 0, "price"],
          received: "string",
        },
      ]);
    });
  });

  describe("invalid source", () => {
    it("should return 500", async () => {
      const response = await fetch(server.url("/invalid"), {
        method: "POST",
      });

      expect(response.status).toBe(500);
      expect(await response.text()).toBe("Internal Server Error");
    });
  });
});
