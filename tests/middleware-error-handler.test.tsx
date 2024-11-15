import { afterEach, beforeEach, it } from "@std/testing/bdd";
import { spy } from "@std/testing/mock";
import { expect } from "@std/expect";
import { middleware, StatusCode } from "../main.ts";
import { MageTestServer } from "./utils/server.ts";

let server: MageTestServer;

beforeEach(() => {
  server = new MageTestServer();

  server.app.use(middleware.useErrorHandler());

  server.app.get("/", () => {
    throw new Error("Hello, World!");
  });

  server.start();
});

afterEach(async () => {
  await server.stop();
});

it("should handle errors", async () => {
  using consoleError = spy(console, "error");

  const response = await fetch(server.url("/"), {
    method: "GET",
  });

  expect(response.status).toEqual(StatusCode.InternalServerError);
  expect(await response.text()).toBe("Internal Server Error");
  expect(consoleError).toHaveBeenCalled;
});
