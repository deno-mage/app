import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/", (c) => {
    c.text("Hello, World!");
  });

  server.app.post("/", (c) => {
    c.text("Hello, World!");
  });

  server.app.put("/", (c) => {
    c.text("Hello, World!");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("routing - method not allowed", () => {
  it("should send 405 when method not matched", async () => {
    const response = await fetch(server.url("/"), {
      method: "DELETE",
    });

    expect(response.status).toEqual(405);
    expect(response.headers.get("Allow")).toBe("GET, HEAD, POST, PUT");
    expect(await response.text()).toBe("Method Not Allowed");
  });

  it("should not handle OPTIONS requests", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Allow")).toBe("GET, HEAD, POST, PUT");
    expect(await response.text()).toBe("");
  });
});
