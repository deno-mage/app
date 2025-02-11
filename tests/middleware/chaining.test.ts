import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode, StatusText } from "@mage/app";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.use(
    async (_, next) => {
      await next();
      await next();
    },
    async (_, next) => {
      await next();
    },
  );

  server.app.get("/", (context) => {
    context.text(StatusCode.OK, "Hello, World!");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("middleware - chaining", () => {
  it("should throw an error when next is called twice in the same middleware", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toBe(StatusCode.InternalServerError);
    expect(await response.text()).toBe(StatusText.InternalServerError);
  });
});
