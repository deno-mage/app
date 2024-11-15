import { afterEach, beforeEach, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../main.ts";
import { MageTestServer } from "./utils/server.ts";

let server: MageTestServer;

beforeEach(() => {
  server = new MageTestServer();

  server.app.get("/", (context) => {
    context.json(StatusCode.OK, { message: "Hello, World!" });
  });

  server.start();
});

afterEach(async () => {
  await server.stop();
});

it("should return json response", async () => {
  const response = await fetch(server.url("/"), {
    method: "GET",
  });

  expect(response.status).toBe(StatusCode.OK);
  expect(response.headers.get("content-type")).toBe("application/json");
  expect(await response.json()).toEqual({ message: "Hello, World!" });
});
