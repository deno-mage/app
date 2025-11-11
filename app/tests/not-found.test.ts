import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/not-found", (c) => {
    c.notFound();
  });

  server.app.get("/not-found-custom-text", (c) => {
    c.notFound("Custom Not Found Message");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("responses - not found", () => {
  it("should return not found response with default status text", async () => {
    const response = await fetch(server.url("/not-found"), {
      method: "GET",
    });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not Found");
  });

  it("should return not found response with custom text", async () => {
    const response = await fetch(server.url("/not-found-custom-text"), {
      method: "GET",
    });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Custom Not Found Message");
  });
});
