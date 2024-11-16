import { afterEach, beforeEach, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../exports.ts";
import { MageTestServer } from "./utils/server.ts";

let server: MageTestServer;

beforeEach(() => {
  server = new MageTestServer();

  server.app.get("/one", (context) => {
    context.text(StatusCode.OK, "one");
  });

  server.app.get("/two", (context) => {
    context.text(StatusCode.OK, "two");
  });

  server.app.get("/three", (context) => {
    context.text(StatusCode.OK, "three");
  });

  server.start();
});

afterEach(async () => {
  await server.stop();
});

it("should hit route one", async () => {
  const response = await fetch(server.url("/one"), {
    method: "GET",
  });

  expect(await response.text()).toBe("one");
});

it("should hit route two", async () => {
  const response = await fetch(server.url("/two"), {
    method: "GET",
  });

  expect(await response.text()).toBe("two");
});

it("should hit route three", async () => {
  const response = await fetch(server.url("/three"), {
    method: "GET",
  });

  expect(await response.text()).toBe("three");
});
