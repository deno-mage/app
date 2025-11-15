import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  // Test memoized body methods
  server.app.post("/body-read-twice", async (c) => {
    const first = await c.req.text();
    const second = await c.req.text(); // Should return same result (memoized)
    c.json({ first, second, match: first === second });
  });

  server.app.post("/body-json-then-text", async (c) => {
    try {
      await c.req.json();
      await c.req.text(); // Different method, but should work due to memoization
      c.text("Should not reach here");
    } catch (error) {
      c.json({ error: (error as Error).message });
    }
  });

  server.app.post("/body-arrayBuffer", async (c) => {
    const buffer = await c.req.arrayBuffer();
    c.json({ byteLength: buffer.byteLength });
  });

  server.app.post("/body-blob", async (c) => {
    const blob = await c.req.blob();
    c.json({ size: blob.size, type: blob.type });
  });

  server.app.post("/body-formData", async (c) => {
    const formData = await c.req.formData();
    const name = formData.get("name");
    c.json({ name });
  });

  // Test validation result storage and retrieval
  server.app.post("/validation-missing", (c) => {
    try {
      c.req.valid("json"); // No validation result set
      c.text("Should not reach here");
    } catch (error) {
      c.json({ error: (error as Error).message });
    }
  });

  server.app.post("/validation-set-and-get", (c) => {
    c.req.setValidationResult("json", { username: "test", age: 25 });
    const result = c.req.valid<{ username: string; age: number }>("json");
    c.json(result);
  });

  // Test header and searchParam methods
  server.app.get("/header-access", (c) => {
    const contentType = c.req.header("Content-Type");
    const customHeader = c.req.header("X-Custom-Header");
    c.json({ contentType, customHeader });
  });

  server.app.get("/search-param-access", (c) => {
    const page = c.req.searchParam("page");
    const limit = c.req.searchParam("limit");
    const missing = c.req.searchParam("missing");
    c.json({ page, limit, missing });
  });

  // Test params and wildcard
  server.app.get("/users/:id/posts/:postId", (c) => {
    c.json({ params: c.req.params });
  });

  server.app.get("/files/*", (c) => {
    c.json({ wildcard: c.req.wildcard });
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("MageRequest", () => {
  describe("memoized body access", () => {
    it("should allow reading text body twice (memoized)", async () => {
      const response = await fetch(server.url("/body-read-twice"), {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "Hello World",
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        first: "Hello World",
        second: "Hello World",
        match: true,
      });
    });

    it("should handle arrayBuffer body", async () => {
      const body = new Uint8Array([1, 2, 3, 4, 5]);
      const response = await fetch(server.url("/body-arrayBuffer"), {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: body,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.byteLength).toBe(5);
    });

    it("should handle blob body", async () => {
      const blob = new Blob(["test content"], { type: "text/plain" });
      const response = await fetch(server.url("/body-blob"), {
        method: "POST",
        body: blob,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.size).toBe(12);
      expect(data.type).toBe("text/plain");
    });

    it("should handle formData body", async () => {
      const formData = new FormData();
      formData.append("name", "John Doe");

      const response = await fetch(server.url("/body-formData"), {
        method: "POST",
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.name).toBe("John Doe");
    });
  });

  describe("validation results", () => {
    it("should throw error when accessing validation result that doesn't exist", async () => {
      const response = await fetch(server.url("/validation-missing"), {
        method: "POST",
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.error).toBe("No validation result found for json");
    });

    it("should store and retrieve validation results", async () => {
      const response = await fetch(server.url("/validation-set-and-get"), {
        method: "POST",
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ username: "test", age: 25 });
    });
  });

  describe("header access", () => {
    it("should get request headers", async () => {
      const response = await fetch(server.url("/header-access"), {
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Header": "custom-value",
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.contentType).toBe("application/json");
      expect(data.customHeader).toBe("custom-value");
    });

    it("should return null for missing headers", async () => {
      const response = await fetch(server.url("/header-access"));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.contentType).toBe(null);
      expect(data.customHeader).toBe(null);
    });
  });

  describe("search param access", () => {
    it("should get URL search parameters", async () => {
      const response = await fetch(
        server.url("/search-param-access?page=1&limit=10"),
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.page).toBe("1");
      expect(data.limit).toBe("10");
      expect(data.missing).toBe(null);
    });
  });

  describe("params access", () => {
    it("should extract route parameters", async () => {
      const response = await fetch(server.url("/users/123/posts/456"));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.params).toEqual({ id: "123", postId: "456" });
    });
  });

  describe("wildcard access", () => {
    it("should extract wildcard path", async () => {
      const response = await fetch(server.url("/files/documents/report.pdf"));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.wildcard).toBe("documents/report.pdf");
    });
  });
});
