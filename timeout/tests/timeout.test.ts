import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { timeout } from "../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  // Fast response (should not timeout)
  server.app.get("/fast", timeout({ ms: 1000 }), (c) => {
    c.text("Fast response");
  });

  // Slow response (should timeout with default)
  server.app.get("/slow-default", timeout(), async (c) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    c.text("Slow response");
  });

  // Slow response (should timeout with custom timeout)
  server.app.get("/slow", timeout({ ms: 100 }), async (c) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    c.text("Should not see this");
  });

  // Edge case: exactly at timeout boundary
  server.app.get("/boundary", timeout({ ms: 100 }), async (c) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    c.text("Boundary response");
  });

  // Very short timeout
  server.app.get("/very-short", timeout({ ms: 1 }), async (c) => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    c.text("Should timeout");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
  // Wait for any pending timers from timed-out requests to complete
  await new Promise((resolve) => setTimeout(resolve, 250));
});

describe("timeout", () => {
  it("should allow fast requests", async () => {
    const response = await fetch(server.url("/fast"), {
      method: "GET",
    });

    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toBe("Fast response");
  });

  it("should allow request that completes within default timeout", async () => {
    const response = await fetch(server.url("/slow-default"), {
      method: "GET",
    });

    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toBe("Slow response");
  });

  it("should timeout request exceeding custom timeout", async () => {
    const response = await fetch(server.url("/slow"), {
      method: "GET",
    });

    await response.text();

    expect(response.status).toBe(408);
  });

  it("should handle request at timeout boundary", async () => {
    const response = await fetch(server.url("/boundary"), {
      method: "GET",
    });

    await response.text();

    // This test may occasionally timeout due to scheduling,
    // but should generally pass or fail gracefully
    expect([200, 408]).toContain(response.status);
  });

  it("should timeout very slow request with short timeout", async () => {
    const response = await fetch(server.url("/very-short"), {
      method: "GET",
    });

    await response.text();

    expect(response.status).toBe(408);
  });

  describe("validation", () => {
    it("should throw error when timeout is zero", () => {
      expect(() => {
        timeout({ ms: 0 });
      }).toThrow("[Timeout middleware] timeout must be a positive number");
    });

    it("should throw error when timeout is negative", () => {
      expect(() => {
        timeout({ ms: -1 });
      }).toThrow("[Timeout middleware] timeout must be a positive number");
    });
  });
});
