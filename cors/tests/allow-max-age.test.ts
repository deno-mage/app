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
      maxAge: 600,
    }),
  );
  server.app.get(
    "/",
    cors({
      maxAge: 600,
    }),
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("cors - allow max age", () => {
  it("should not send back header when GET", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Max-Age")).toBeNull();
  });

  it("should send back header when OPTIONS", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Max-Age")).toBe("600");
  });
});
