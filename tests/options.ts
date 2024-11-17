import { afterAll, beforeAll, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../exports.ts";
import { MageTestServer } from "./utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.delete("/", (context) => {
    context.text(StatusCode.OK, "delete");
  });

  server.app.get("/", (context) => {
    context.text(StatusCode.OK, "get");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

it("should handle OPTIONS request (has methods)", async () => {
  const response = await fetch(server.url("/"), {
    method: "OPTIONS",
  });

  expect(response.status).toBe(StatusCode.NoContent);
  expect(response.headers.get("Allow")).toBe("DELETE, GET, HEAD");
  expect(await response.text()).toBe("");
});

it("should handle OPTIONS request (no methods)", async () => {
  const response = await fetch(server.url("/foo"), {
    method: "OPTIONS",
  });

  expect(response.status).toBe(StatusCode.NoContent);
  expect(response.headers.get("Allow")).toBe("");
  expect(await response.text()).toBe("");
});
