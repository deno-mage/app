import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { cors } from "../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.options(
    "/",
    cors({
      origins: "*",
    }),
  );
  server.app.get(
    "/",
    cors({
      origins: "*",
    }),
  );

  server.app.options(
    "/multi",
    cors({
      origins: ["https://example.com"],
    }),
  );
  server.app.get(
    "/multi",
    cors({
      origins: ["https://example.com"],
    }),
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("cors - allow origin", () => {
  it("should send back header when GET", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toEqual("*");
  });

  it("should send back header when OPTIONS", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toEqual("*");
  });

  it("should send back headers when not wildcard when GET", async () => {
    const response = await fetch(server.url("/multi"), {
      method: "GET",
      headers: {
        Origin: "https://example.com",
      },
    });

    expect(response.status).toEqual(204);
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

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toEqual(
      "https://example.com",
    );
    expect(response.headers.get("Vary")).toEqual("Origin");
  });
});
