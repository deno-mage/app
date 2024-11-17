import { afterAll, beforeAll, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { middleware, StatusCode } from "../exports.ts";
import { MageTestServer } from "./utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.use(middleware.useOptions());

  server.app.delete("/known", (context) => {
    context.text(StatusCode.OK, "delete");
  });

  server.app.get("/known", (context) => {
    context.text(StatusCode.OK, "get");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

it("should return available methods on known path", async () => {
  const response = await fetch(server.url("/known"), {
    method: "OPTIONS",
  });

  expect(response.status).toBe(StatusCode.NoContent);
  expect(response.headers.get("Allow")).toBe("DELETE, GET, HEAD");
  expect(await response.text()).toBe("");
});

it("should return no available methods on unknown", async () => {
  const response = await fetch(server.url("/unknown"), {
    method: "OPTIONS",
  });

  expect(response.status).toBe(StatusCode.NoContent);
  expect(response.headers.get("Allow")).toBe("");
  expect(await response.text()).toBe("");
});
