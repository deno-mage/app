import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { HttpMethod, StatusCode } from "@mage/app";
import { useCORS } from "@mage/middlewares";
import { MageTestServer } from "../../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.options(
    "/",
    useCORS({
      methods: [HttpMethod.Delete, HttpMethod.Get, HttpMethod.Options],
    }),
  );
  server.app.get(
    "/",
    useCORS({
      methods: [HttpMethod.Delete, HttpMethod.Get, HttpMethod.Options],
    }),
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("middleware - cors - allow methods", () => {
  it("should not send back header when GET", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toEqual(StatusCode.NoContent);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBeNull();
  });

  it("should send back header when OPTIONS", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toEqual(StatusCode.NoContent);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "DELETE, GET, OPTIONS",
    );
  });
});
