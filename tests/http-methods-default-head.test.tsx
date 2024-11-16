import { afterAll, beforeAll, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../exports.ts";
import { MageTestServer } from "./utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/", (context) => {
    context.text(StatusCode.OK, "Hello, World!");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

it("should return result of GET without body when HEAD requested", async () => {
  const response = await fetch(server.url("/"), {
    method: "HEAD",
  });

  expect(response.status).toBe(StatusCode.OK);
  expect(response.headers.get("Content-Length")).toBe("13");
  expect(await response.text()).toBe("");
});
