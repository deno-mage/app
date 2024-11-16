import { afterAll, beforeAll, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../exports.ts";
import { MageTestServer } from "./utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/set", (context) => {
    context.response.headers.set("X-Test", "test");
    context.text(StatusCode.OK, "set");
  });

  server.app.get(
    "/delete",
    (context) => {
      context.response.headers.set("X-Test", "test");
    },
    (context) => {
      context.response.headers.delete("X-Test");
      context.text(StatusCode.OK, "unset");
    }
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

it("should set header", async () => {
  const response = await fetch(server.url("/set"), {
    method: "GET",
  });

  expect(response.headers.get("X-Test")).toBe("test");
  expect(await response.text()).toBe("set");
});

it("should delete header", async () => {
  const response = await fetch(server.url("/delete"), {
    method: "GET",
  });

  expect(response.headers.get("X-Test")).toBe(null);
  expect(await response.text()).toBe("unset");
});
