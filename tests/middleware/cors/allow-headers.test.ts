import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode, useCors } from "../../../mod.ts";
import { MageTestServer } from "../../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.options(
    "/",
    useCors({
      headers: ["X-Custom-Header-One", "X-Custom-Header-Two"],
    }),
  );
  server.app.get(
    "/",
    useCors({
      headers: ["X-Custom-Header-One", "X-Custom-Header-Two"],
    }),
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("middleware - cors - allow headers", () => {
  it("should not send back header when GET", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toEqual(StatusCode.NoContent);
    expect(response.headers.get("Access-Control-Allow-Headers")).toBeNull();
  });

  it("should send back header when OPTIONS", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toEqual(StatusCode.NoContent);
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
      "X-Custom-Header-One, X-Custom-Header-Two",
    );
  });
});
