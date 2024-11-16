import { afterAll, beforeAll, it } from "@std/testing/bdd";
import { spy } from "@std/testing/mock";
import { expect } from "@std/expect";
import { middleware, StatusCode } from "../exports.ts";
import { MageTestServer } from "./utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.use(middleware.useErrorHandler());

  server.app.get("/error", () => {
    throw new Error("Hello, World!");
  });

  server.app.get("/no-error", (context) => {
    context.text(StatusCode.OK, "Hello, World!");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

it("should handle errors", async () => {
  using consoleError = spy(console, "error");

  const response = await fetch(server.url("/error"), {
    method: "GET",
  });

  expect(response.status).toEqual(StatusCode.InternalServerError);
  expect(await response.text()).toBe("Internal Server Error");
  expect(consoleError).toHaveBeenCalled;
});

it("should not interrupt healthy responses", async () => {
  using consoleError = spy(console, "error");

  const response = await fetch(server.url("/no-error"), {
    method: "GET",
  });

  expect(response.status).toEqual(StatusCode.OK);
  expect(await response.text()).toBe("Hello, World!");
  expect(consoleError).not.toHaveBeenCalled;
});