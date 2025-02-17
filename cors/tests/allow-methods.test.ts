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
      methods: ["DELETE", "GET", "OPTIONS"],
    }),
  );
  server.app.get(
    "/",
    useCORS({
      methods: ["DELETE", "GET", "OPTIONS"],
    }),
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("cors - allow methods", () => {
  it("should not send back header when GET", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBeNull();
  });

  it("should send back header when OPTIONS", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "DELETE, GET, OPTIONS",
    );
  });
});
