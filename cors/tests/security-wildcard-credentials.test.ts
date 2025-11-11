import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { cors } from "../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  // This should throw an error during request handling
  server.app.get(
    "/wildcard-with-credentials",
    cors({
      origins: "*",
      credentials: true,
    }),
  );

  // This should work fine (no wildcard)
  server.app.get(
    "/specific-origin-with-credentials",
    cors({
      origins: ["https://example.com"],
      credentials: true,
    }),
  );

  // This should work fine (wildcard without credentials)
  server.app.get(
    "/wildcard-without-credentials",
    cors({
      origins: "*",
      credentials: false,
    }),
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("cors - security: wildcard with credentials", () => {
  it("should throw error when using wildcard origin with credentials", async () => {
    const response = await fetch(server.url("/wildcard-with-credentials"), {
      method: "GET",
      headers: {
        Origin: "https://example.com",
      },
    });

    expect(response.status).toEqual(400);
    expect(await response.text()).toBe("Bad Request");
  });

  it("should allow specific origin with credentials", async () => {
    const response = await fetch(
      server.url("/specific-origin-with-credentials"),
      {
        method: "GET",
        headers: {
          Origin: "https://example.com",
        },
      },
    );

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://example.com",
    );
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe(
      "true",
    );
  });

  it("should allow wildcard origin without credentials", async () => {
    const response = await fetch(server.url("/wildcard-without-credentials"), {
      method: "GET",
      headers: {
        Origin: "https://example.com",
      },
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBeNull();
  });
});
