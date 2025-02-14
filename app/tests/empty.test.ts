import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/default", (c) => {
    c.empty();
  });

  server.app.get("/set-status", (c) => {
    c.empty(205);
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("responses - empty", () => {
  it("should return empty response with default status", async () => {
    const response = await fetch(server.url("/default"), {
      method: "GET",
    });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });

  it("should return empty response with set status", async () => {
    const response = await fetch(server.url("/set-status"), {
      method: "GET",
    });

    expect(response.status).toBe(205);
    expect(await response.text()).toBe("");
  });
});
