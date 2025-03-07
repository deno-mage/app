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
      credentials: false,
    }),
  );
  server.app.get(
    "/",
    cors({
      credentials: false,
    }),
  );
  server.app.options(
    "/credentials",
    cors({
      credentials: true,
    }),
  );
  server.app.get(
    "/credentials",
    cors({
      credentials: true,
    }),
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("cors - allow credentials", () => {
  it("should send back header when credentials false when GET", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBeNull();
  });

  it("should send back header when credentials false when OPTIONS", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBeNull();
  });

  it("should send back header when credentials true when GET", async () => {
    const response = await fetch(server.url("/credentials"), {
      method: "GET",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe(
      "true",
    );
  });

  it("should send back header when credentials true when OPTIONS", async () => {
    const response = await fetch(server.url("/credentials"), {
      method: "OPTIONS",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe(
      "true",
    );
  });
});
