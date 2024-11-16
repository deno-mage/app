import { afterEach, beforeEach, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { middleware, StatusCode } from "../exports.ts";
import { MageTestServer } from "./utils/server.ts";

let server: MageTestServer;

beforeEach(() => {
  server = new MageTestServer();

  server.app.use(middleware.useNotFoundHandler());

  server.start();
});

afterEach(async () => {
  await server.stop();
});

it("should handle unhandled requests", async () => {
  const response = await fetch(server.url("/"), {
    method: "GET",
  });

  expect(response.status).toEqual(StatusCode.NotFound);
  expect(await response.text()).toBe("Not Found");
});
