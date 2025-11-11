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

  server.app.get("/preserve-before-text", (c) => {
    c.header("X-Custom", "value");
    c.header("Cache-Control", "max-age=3600");
    c.text("Hello");
  });

  server.app.get("/preserve-before-json", (c) => {
    c.header("X-Custom", "value");
    c.header("Cache-Control", "max-age=3600");
    c.json({ message: "Hello" });
  });

  server.app.get("/preserve-before-empty", (c) => {
    c.header("X-Custom", "value");
    c.empty(204);
  });

  server.app.get("/preserve-before-redirect", (c) => {
    c.header("X-Custom", "value");
    c.redirect("/other", 302);
  });

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

  it("should preserve headers set before text()", async () => {
    const response = await fetch(server.url("/preserve-before-text"));

    expect(response.headers.get("X-Custom")).toBe("value");
    expect(response.headers.get("Cache-Control")).toBe("max-age=3600");
    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=UTF-8",
    );
    expect(await response.text()).toBe("Hello");
  });

  it("should preserve headers set before json()", async () => {
    const response = await fetch(server.url("/preserve-before-json"));

    expect(response.headers.get("X-Custom")).toBe("value");
    expect(response.headers.get("Cache-Control")).toBe("max-age=3600");
    expect(response.headers.get("Content-Type")).toBe(
      "application/json; charset=UTF-8",
    );
    const json = await response.json();
    expect(json).toEqual({ message: "Hello" });
  });

  it("should preserve headers set before empty()", async () => {
    const response = await fetch(server.url("/preserve-before-empty"));

    expect(response.headers.get("X-Custom")).toBe("value");
    expect(response.status).toBe(204);
    await response.text(); // Consume body
  });

  it("should preserve headers set before redirect()", async () => {
    const response = await fetch(server.url("/preserve-before-redirect"), {
      redirect: "manual",
    });

    expect(response.headers.get("X-Custom")).toBe("value");
    expect(response.headers.get("Location")).toBe("/other");
    expect(response.status).toBe(302);
    await response.text(); // Consume body
  });
});
