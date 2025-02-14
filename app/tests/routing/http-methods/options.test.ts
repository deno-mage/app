import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.delete("/", (c) => {
    c.text("delete");
  });

  server.app.get("/", (c) => {
    c.text("get");
  });

  server.app.options("/custom", (c) => {
    c.empty();
    c.res.headers.set("Allow", "CUSTOM");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("routing - HTTP methods - options", () => {
  it("should return correct response (has methods)", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("allow")).toBe("DELETE, GET, HEAD");
  });

  it("should return correct response (no methods)", async () => {
    const response = await fetch(server.url("/foo"), {
      method: "OPTIONS",
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("allow")).toBe("");
  });

  it("should return correct response (custom)", async () => {
    const response = await fetch(server.url("/custom"), {
      method: "OPTIONS",
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("allow")).toBe("CUSTOM");
  });
});
