import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../../../app/mod.ts";
import { useCORS } from "../../../middlewares/mod.ts";
import { MageTestServer } from "../../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.options(
    "/",
    useCORS({
      origins: "*",
    }),
  );
  server.app.get(
    "/",
    useCORS({
      origins: "*",
    }),
  );

  server.app.options(
    "/multi",
    useCORS({
      origins: ["https://example.com"],
    }),
  );
  server.app.get(
    "/multi",
    useCORS({
      origins: ["https://example.com"],
    }),
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("middleware - cors - allow origin", () => {
  it("should send back header when GET", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toEqual(StatusCode.NoContent);
    expect(response.headers.get("Access-Control-Allow-Origin")).toEqual("*");
  });

  it("should send back header when OPTIONS", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toEqual(StatusCode.NoContent);
    expect(response.headers.get("Access-Control-Allow-Origin")).toEqual("*");
  });

  it("should send back headers when not wildcard when GET", async () => {
    const response = await fetch(server.url("/multi"), {
      method: "GET",
      headers: {
        Origin: "https://example.com",
      },
    });

    expect(response.status).toEqual(StatusCode.NoContent);
    expect(response.headers.get("Access-Control-Allow-Origin")).toEqual(
      "https://example.com",
    );
    expect(response.headers.get("Vary")).toEqual("Origin");
  });

  it("should send back headers when not wildcard when OPTIONS", async () => {
    const response = await fetch(server.url("/multi"), {
      method: "OPTIONS",
      headers: {
        Origin: "https://example.com",
      },
    });

    expect(response.status).toEqual(StatusCode.NoContent);
    expect(response.headers.get("Access-Control-Allow-Origin")).toEqual(
      "https://example.com",
    );
    expect(response.headers.get("Vary")).toEqual("Origin");
  });
});
