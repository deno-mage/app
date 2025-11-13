import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { bodySize } from "../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  // Default max size (1MB)
  server.app.post("/default", bodySize(), (c) => {
    c.text("OK");
  });

  // Custom max size (100 bytes)
  server.app.post("/small", bodySize({ maxSize: 100 }), (c) => {
    c.text("OK");
  });

  // Large max size (10MB)
  server.app.post("/large", bodySize({ maxSize: 10485760 }), (c) => {
    c.text("OK");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("body-size", () => {
  it("should allow request within default size limit", async () => {
    const body = "x".repeat(1000); // 1KB

    const response = await fetch(server.url("/default"), {
      method: "POST",
      headers: {
        "Content-Length": body.length.toString(),
      },
      body,
    });

    await response.text();

    expect(response.status).toBe(200);
  });

  it("should reject request exceeding default size limit", async () => {
    const body = "x".repeat(2 * 1024 * 1024); // 2MB

    const response = await fetch(server.url("/default"), {
      method: "POST",
      headers: {
        "Content-Length": body.length.toString(),
      },
      body,
    });

    await response.text();

    expect(response.status).toBe(413);
  });

  it("should respect custom max size", async () => {
    const body = "x".repeat(50); // 50 bytes

    const response = await fetch(server.url("/small"), {
      method: "POST",
      headers: {
        "Content-Length": body.length.toString(),
      },
      body,
    });

    await response.text();

    expect(response.status).toBe(200);
  });

  it("should reject request exceeding custom max size", async () => {
    const body = "x".repeat(200); // 200 bytes

    const response = await fetch(server.url("/small"), {
      method: "POST",
      headers: {
        "Content-Length": body.length.toString(),
      },
      body,
    });

    await response.text();

    expect(response.status).toBe(413);
  });

  it("should allow request at exact max size boundary", async () => {
    const body = "x".repeat(100); // Exactly 100 bytes

    const response = await fetch(server.url("/small"), {
      method: "POST",
      headers: {
        "Content-Length": body.length.toString(),
      },
      body,
    });

    await response.text();

    expect(response.status).toBe(200);
  });

  it("should reject request at max size + 1 byte", async () => {
    const body = "x".repeat(101); // 101 bytes

    const response = await fetch(server.url("/small"), {
      method: "POST",
      headers: {
        "Content-Length": body.length.toString(),
      },
      body,
    });

    await response.text();

    expect(response.status).toBe(413);
  });

  it("should allow large request with increased limit", async () => {
    const body = "x".repeat(5 * 1024 * 1024); // 5MB

    const response = await fetch(server.url("/large"), {
      method: "POST",
      headers: {
        "Content-Length": body.length.toString(),
      },
      body,
    });

    await response.text();

    expect(response.status).toBe(200);
  });

  it("should allow request without Content-Length header", async () => {
    // When no Content-Length is provided, we can't pre-check
    const body = "small body";

    const response = await fetch(server.url("/default"), {
      method: "POST",
      body,
    });

    await response.text();

    expect(response.status).toBe(200);
  });

  describe("validation", () => {
    it("should throw error when maxSize is zero", () => {
      expect(() => {
        bodySize({ maxSize: 0 });
      }).toThrow("[Body Size middleware] maxSize must be a positive number");
    });

    it("should throw error when maxSize is negative", () => {
      expect(() => {
        bodySize({ maxSize: -1 });
      }).toThrow("[Body Size middleware] maxSize must be a positive number");
    });
  });
});
