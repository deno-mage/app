import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { cors } from "../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  // Test that middleware chain continues after CORS
  server.app.options(
    "/",
    cors({
      origins: "*",
      methods: ["GET", "POST"],
    }),
    (c) => {
      // This middleware should run after CORS
      c.header("X-Custom-After-CORS", "true");
    },
  );

  server.app.get(
    "/",
    cors({
      origins: "*",
    }),
    (c) => {
      // This middleware should run after CORS
      c.text("GET response");
    },
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("cors - middleware chaining", () => {
  it("should allow middleware chain to continue after cors on OPTIONS", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, POST",
    );
    // Verify subsequent middleware ran
    expect(response.headers.get("X-Custom-After-CORS")).toBe("true");
  });

  it("should allow middleware chain to continue after cors on GET", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toEqual(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    // Preflight-only headers should be removed for actual requests
    expect(response.headers.get("Access-Control-Allow-Methods")).toBeNull();
    expect(await response.text()).toBe("GET response");
  });

  it("should keep preflight headers on OPTIONS requests", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toEqual(204);
    // Preflight headers should NOT be removed for OPTIONS requests
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, POST",
    );
  });
});
