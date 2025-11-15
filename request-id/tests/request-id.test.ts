import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { requestId } from "../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  // Default configuration
  server.app.get("/default", requestId(), (c) => {
    const id = c.get("requestId");
    c.json({ requestId: id });
  });

  // Custom header name
  server.app.get(
    "/custom-header",
    requestId({ headerName: "X-Trace-ID" }),
    (c) => {
      const id = c.get("requestId");
      c.json({ requestId: id });
    },
  );

  // Custom generator
  let counter = 0;
  server.app.get(
    "/custom-generator",
    requestId({ generator: () => `req-${++counter}` }),
    (c) => {
      const id = c.get("requestId");
      c.json({ requestId: id });
    },
  );

  // Multiple middleware chaining
  server.app.get(
    "/chained",
    requestId(),
    (c, next) => {
      // Middleware can access request ID
      const id = c.get("requestId");
      c.set("middlewareSeenId", id);
      return next();
    },
    (c) => {
      const id = c.get("requestId");
      const middlewareId = c.get("middlewareSeenId");
      c.json({ requestId: id, middlewareSeenId: middlewareId });
    },
  );

  // Client provides request ID
  server.app.get("/client-provided", requestId(), (c) => {
    const id = c.get("requestId");
    c.json({ requestId: id });
  });

  // Both custom header and generator
  let customCounter = 0;
  server.app.get(
    "/both-custom",
    requestId({
      headerName: "X-Custom-ID",
      generator: () => `custom-${++customCounter}`,
    }),
    (c) => {
      const id = c.get("requestId");
      c.json({ requestId: id });
    },
  );

  // Test that ID persists through async operations
  server.app.get("/async", requestId(), async (c) => {
    const idBefore = c.get("requestId");
    await new Promise((resolve) => setTimeout(resolve, 10));
    const idAfter = c.get("requestId");
    c.json({ idBefore, idAfter, matches: idBefore === idAfter });
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("requestId", () => {
  describe("default configuration", () => {
    it("should generate UUID request ID", async () => {
      const response = await fetch(server.url("/default"));

      expect(response.status).toBe(200);

      // Check response header
      const headerValue = response.headers.get("X-Request-ID");
      expect(headerValue).toBeTruthy();
      expect(headerValue).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );

      // Check body
      const data = await response.json();
      expect(data.requestId).toBe(headerValue);
    });

    it("should generate unique IDs for different requests", async () => {
      const response1 = await fetch(server.url("/default"));
      const response2 = await fetch(server.url("/default"));

      const id1 = response1.headers.get("X-Request-ID");
      const id2 = response2.headers.get("X-Request-ID");

      // Consume response bodies to prevent resource leaks
      await response1.text();
      await response2.text();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it("should reuse client-provided request ID", async () => {
      const clientId = "client-provided-id-12345";

      const response = await fetch(server.url("/client-provided"), {
        headers: {
          "X-Request-ID": clientId,
        },
      });

      expect(response.status).toBe(200);

      // Server should echo back the client's ID
      const headerValue = response.headers.get("X-Request-ID");
      expect(headerValue).toBe(clientId);

      const data = await response.json();
      expect(data.requestId).toBe(clientId);
    });
  });

  describe("custom header name", () => {
    it("should use custom header name", async () => {
      const response = await fetch(server.url("/custom-header"));

      expect(response.status).toBe(200);

      // Should use X-Trace-ID instead of X-Request-ID
      const traceId = response.headers.get("X-Trace-ID");
      expect(traceId).toBeTruthy();
      expect(traceId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );

      // Should NOT set X-Request-ID
      const requestId = response.headers.get("X-Request-ID");
      expect(requestId).toBeNull();

      const data = await response.json();
      expect(data.requestId).toBe(traceId);
    });

    it("should read client ID from custom header", async () => {
      const clientId = "custom-trace-789";

      const response = await fetch(server.url("/custom-header"), {
        headers: {
          "X-Trace-ID": clientId,
        },
      });

      const traceId = response.headers.get("X-Trace-ID");
      expect(traceId).toBe(clientId);

      const data = await response.json();
      expect(data.requestId).toBe(clientId);
    });
  });

  describe("custom generator", () => {
    it("should use custom generator function", async () => {
      const response = await fetch(server.url("/custom-generator"));

      expect(response.status).toBe(200);

      const headerValue = response.headers.get("X-Request-ID");
      expect(headerValue).toMatch(/^req-\d+$/);

      const data = await response.json();
      expect(data.requestId).toBe(headerValue);
    });

    it("should increment counter for each request", async () => {
      const response1 = await fetch(server.url("/custom-generator"));
      const response2 = await fetch(server.url("/custom-generator"));

      const id1 = response1.headers.get("X-Request-ID");
      const id2 = response2.headers.get("X-Request-ID");

      // Consume response bodies
      await response1.text();
      await response2.text();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);

      // Both should match the pattern
      expect(id1).toMatch(/^req-\d+$/);
      expect(id2).toMatch(/^req-\d+$/);
    });
  });

  describe("middleware chaining", () => {
    it("should make request ID available to all middleware", async () => {
      const response = await fetch(server.url("/chained"));

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.requestId).toBeTruthy();
      expect(data.middlewareSeenId).toBe(data.requestId);
    });
  });

  describe("both custom header and generator", () => {
    it("should use custom generator when no client ID provided", async () => {
      const response = await fetch(server.url("/both-custom"));

      const customId = response.headers.get("X-Custom-ID");
      expect(customId).toMatch(/^custom-\d+$/);

      const data = await response.json();
      expect(data.requestId).toBe(customId);
    });

    it("should prefer client-provided ID over custom generator", async () => {
      const clientId = "client-custom-id-xyz";

      const response = await fetch(server.url("/both-custom"), {
        headers: {
          "X-Custom-ID": clientId,
        },
      });

      const customId = response.headers.get("X-Custom-ID");
      expect(customId).toBe(clientId);

      const data = await response.json();
      expect(data.requestId).toBe(clientId);
    });
  });

  describe("async operations", () => {
    it("should maintain request ID through async operations", async () => {
      const response = await fetch(server.url("/async"));

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.idBefore).toBeTruthy();
      expect(data.idAfter).toBe(data.idBefore);
      expect(data.matches).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle special characters in client ID", async () => {
      const specialId = "req-2024/01/15#test@domain.com";

      const response = await fetch(server.url("/default"), {
        headers: {
          "X-Request-ID": specialId,
        },
      });

      const id = response.headers.get("X-Request-ID");
      expect(id).toBe(specialId);

      const data = await response.json();
      expect(data.requestId).toBe(specialId);
    });

    it("should handle very long client ID", async () => {
      const longId = "x".repeat(200);

      const response = await fetch(server.url("/default"), {
        headers: {
          "X-Request-ID": longId,
        },
      });

      const id = response.headers.get("X-Request-ID");
      expect(id).toBe(longId);

      const data = await response.json();
      expect(data.requestId).toBe(longId);
    });

    it("should handle numeric client ID", async () => {
      const numericId = "1234567890";

      const response = await fetch(server.url("/default"), {
        headers: {
          "X-Request-ID": numericId,
        },
      });

      const id = response.headers.get("X-Request-ID");
      expect(id).toBe(numericId);

      const data = await response.json();
      expect(data.requestId).toBe(numericId);
    });
  });
});
