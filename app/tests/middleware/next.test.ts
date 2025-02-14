import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.use(
    async (c, next) => {
      c.set("value", "Hello, World!");
      await next();
    },
  );

  server.app.get("/", (c) => {
    c.text(c.get("value"));
  });

  server.app.get("/double-call", async (_, next) => {
    await next();
    await next();
  }, (c) => {
    c.text("Hello, World!");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("middleware - next", () => {
  it("should chain middleware calling next ", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Hello, World!");
  });

  it("should throw an error when next is called twice in the same middleware", async () => {
    const response = await fetch(server.url("/double-call"), {
      method: "GET",
    });

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("Internal Server Error");
  });
});
