import { afterAll, beforeAll, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../exports.ts";
import { MageTestServer } from "./utils/server.ts";
import { StatusText } from "../src/http.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/", (context) => {
    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.post("/", (context) => {
    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.put("/", (context) => {
    context.text(StatusCode.OK, "Hello, World!");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

it("should send 405 when method not matched", async () => {
  const response = await fetch(server.url("/"), {
    method: "DELETE",
  });

  expect(response.status).toEqual(StatusCode.MethodNotAllowed);
  expect(response.headers.get("Allow")).toBe("GET, HEAD, POST, PUT");
  expect(await response.text()).toBe(StatusText.MethodNotAllowed);
});

it("should not handle OPTIONS requests", async () => {
  const response = await fetch(server.url("/"), {
    method: "OPTIONS",
  });

  expect(response.status).toEqual(StatusCode.NoContent);
  expect(response.headers.get("Allow")).toBe("GET, HEAD, POST, PUT");
  expect(await response.text()).toBe("");
});
