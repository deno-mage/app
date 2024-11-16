import { afterEach, beforeEach, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../exports.ts";
import { MageTestServer } from "./utils/server.ts";

let server: MageTestServer;

beforeEach(() => {
  server = new MageTestServer();

  server.app.delete("/", (context) => {
    context.text(StatusCode.OK, "delete");
  });

  server.app.get("/", (context) => {
    context.text(StatusCode.OK, "get");
  });

  server.start();
});

afterEach(async () => {
  await server.stop();
});

it("should return available methods for OPTIONS via default middleware", async () => {
  const response = await fetch(server.url("/"), {
    method: "OPTIONS",
  });

  expect(response.status).toBe(StatusCode.OK);
  expect(response.headers.get("Allow")).toBe("DELETE, GET, HEAD");
  expect(await response.text()).toBe("");
});
