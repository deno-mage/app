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
      headers: ["X-Custom-Header-One", "X-Custom-Header-Two"],
    }),
  );
  server.app.get(
    "/",
    cors({
      headers: ["X-Custom-Header-One", "X-Custom-Header-Two"],
    }),
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("cors - allow headers", () => {
  it("should not send back header when GET", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Allow-Headers")).toBeNull();
  });

  it("should send back header when OPTIONS", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
      "X-Custom-Header-One, X-Custom-Header-Two",
    );
  });
});
