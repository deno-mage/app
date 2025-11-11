import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/forbidden", (c) => {
    c.forbidden();
  });

  server.app.get("/forbidden-custom-text", (c) => {
    c.forbidden("Custom Forbidden Message");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("responses - forbidden", () => {
  it("should return forbidden response with default status text", async () => {
    const response = await fetch(server.url("/forbidden"), {
      method: "GET",
    });

    expect(response.status).toBe(403);
    expect(await response.text()).toBe("Forbidden");
  });

  it("should return forbidden response with custom text", async () => {
    const response = await fetch(server.url("/forbidden-custom-text"), {
      method: "GET",
    });

    expect(response.status).toBe(403);
    expect(await response.text()).toBe("Custom Forbidden Message");
  });
});
