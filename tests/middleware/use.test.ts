import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../../exports.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.use(
    async (context, next) => {
      context.response.headers.set("X-Test-One", "Test");
      await next();
    },
    async (context, next) => {
      context.response.headers.set("X-Test-Two", "Test");
      await next();
    },
  );

  server.app.use(
    async (context, next) => {
      context.response.headers.set("X-Test-Three", "Test");
      await next();
    },
    async (context, next) => {
      context.response.headers.set("X-Test-Four", "Test");
      await next();
    },
  );

  server.app.get(
    "/",
    async (context, next) => {
      context.response.headers.set("X-Test-Five", "Test");
      await next();
    },
    (context) => {
      context.text(StatusCode.OK, "Hello, World!");
    },
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("middleware - use", () => {
  it("should return correct response", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toBe(StatusCode.OK);
    expect(await response.text()).toBe("Hello, World!");
    expect(response.headers.get("X-Test-One")).toBe("Test");
    expect(response.headers.get("X-Test-Two")).toBe("Test");
    expect(response.headers.get("X-Test-Three")).toBe("Test");
    expect(response.headers.get("X-Test-Four")).toBe("Test");
    expect(response.headers.get("X-Test-Five")).toBe("Test");
  });
});
