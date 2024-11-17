import { afterAll, beforeAll, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { middleware, StatusCode } from "../exports.ts";
import { MageTestServer } from "./utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.use(middleware.useNotFound(), middleware.useOptions());

  server.start();
});

afterAll(async () => {
  await server.stop();
});

it("should handle unhandled requests", async () => {
  const response = await fetch(server.url("/"), {
    method: "GET",
  });

  expect(response.status).toEqual(StatusCode.NotFound);
  expect(await response.text()).toBe("Not Found");
});

it("should not handle OPTIONS requests", async () => {
  const response = await fetch(server.url("/"), {
    method: "OPTIONS",
  });

  expect(response.status).toEqual(StatusCode.NoContent);
  expect(response.headers.get("Allow")).toBe("");
  expect(await response.text()).toBe("");
});
