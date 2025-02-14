import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { useCORS } from "../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.options(
    "/",
    useCORS({
      exposeHeaders: ["X-Custom-Heade-One", "X-Custom-Header-Two"],
    }),
  );
  server.app.get(
    "/",
    useCORS({
      exposeHeaders: ["X-Custom-Heade-One", "X-Custom-Header-Two"],
    }),
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("middleware - cors - expose headers", () => {
  it("should send back header when GET", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Expose-Headers")).toEqual(
      "X-Custom-Heade-One, X-Custom-Header-Two",
    );
  });

  it("should send back header when OPTIONS", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Expose-Headers")).toEqual(
      "X-Custom-Heade-One, X-Custom-Header-Two",
    );
  });
});
