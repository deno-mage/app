import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../../test-utils/server.ts";
import type { MageMiddleware } from "../../mod.ts";

let server: MageTestServer;

const increment: MageMiddleware = async (c, next) => {
  const value = c.get<number | undefined>("value") ?? 0;
  c.set("value", value + 1);
  await next();
};

beforeAll(() => {
  server = new MageTestServer();

  server.app.use(
    increment,
    [increment, increment],
  );

  server.app.get("/four", (c) => {
    c.text(c.get<number>("value").toString());
  });

  server.app.get("/five", increment, (c) => {
    c.text(c.get<number>("value").toString());
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("middleware - chaining", () => {
  it("should apply middleware to all routes - four", async () => {
    const response = await fetch(server.url("/four"), {
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("4");
  });

  it("should apply middleware to specific routes - five", async () => {
    const response = await fetch(server.url("/five"), {
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("5");
  });
});
