import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.post("/", (c) => {
    c.text("Hello, World!");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("routing - HTTP methods - post", () => {
  it("should return correct response", async () => {
    const response = await fetch(server.url("/"), {
      method: "POST",
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Hello, World!");
  });
});
