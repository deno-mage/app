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
      maxAge: 600,
    }),
  );
  server.app.get(
    "/",
    useCors({
      maxAge: 600,
    }),
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("middleware - cors - allow max age", () => {
  it("should not send back header when GET", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toEqual(StatusCode.NoContent);
    expect(response.headers.get("Access-Control-Max-Age")).toBeNull();
  });

  it("should send back header when OPTIONS", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toEqual(StatusCode.NoContent);
    expect(response.headers.get("Access-Control-Max-Age")).toBe("600");
  });
});
