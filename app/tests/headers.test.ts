import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/get", (c) => {
    c.text(c.req.header("X-Test")!);
  });

  server.app.get("/set", (c) => {
    c.header("X-Test", "test");
    c.text("set");
  });

  server.app.get(
    "/delete",
    async (c, next) => {
      c.header("X-Test", "test");
      await next();
    },
    (c) => {
      c.res.headers.delete("X-Test");
      c.text("unset");
    },
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("headers", () => {
  it("should get request header", async () => {
    const response = await fetch(server.url("/get"), {
      method: "GET",
      headers: {
        "X-Test": "test",
      },
    });

    expect(await response.text()).toBe("test");
  });

  it("should set response header", async () => {
    const response = await fetch(server.url("/set"), {
      method: "GET",
    });

    expect(response.headers.get("X-Test")).toBe("test");
    expect(await response.text()).toBe("set");
  });

  it("should delete response header", async () => {
    const response = await fetch(server.url("/delete"), {
      method: "GET",
    });

    expect(response.headers.get("X-Test")).toBe(null);
    expect(await response.text()).toBe("unset");
  });
});
