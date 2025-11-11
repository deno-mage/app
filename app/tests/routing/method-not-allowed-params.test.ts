import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/users/:id", (c) => {
    c.text(`User ${c.req.params.id}`);
  });

  server.app.post("/users/:id", (c) => {
    c.text(`Update user ${c.req.params.id}`);
  });

  server.app.put("/users/:id", (c) => {
    c.text(`Replace user ${c.req.params.id}`);
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("routing - method not allowed with parameterized routes", () => {
  it("should send 405 with correct Allow header for parameterized routes", async () => {
    const response = await fetch(server.url("/users/123"), {
      method: "DELETE",
    });

    expect(response.status).toEqual(405);
    expect(response.headers.get("Allow")).toBe("GET, HEAD, POST, PUT");
    expect(await response.text()).toBe("Method Not Allowed");
  });

  it("should handle OPTIONS requests for parameterized routes", async () => {
    const response = await fetch(server.url("/users/456"), {
      method: "OPTIONS",
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get("Allow")).toBe("GET, HEAD, POST, PUT");
    expect(await response.text()).toBe("");
  });
});
