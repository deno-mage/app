import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;
let targetServer: MageTestServer;

beforeAll(() => {
  targetServer = new MageTestServer();

  targetServer.app.post("/target", async (c) => {
    c.json({
      source: "target server",
      header: c.req.header("x-test"),
      search: c.req.searchParam("search"),
      body: await c.req.json(),
    });
  });

  targetServer.start();

  server = new MageTestServer();

  server.app.post("/rewrite-external", async (c) => {
    await c.rewrite(targetServer.url("/target").toString());
  });

  server.app.post("/rewrite-local", async (c) => {
    await c.rewrite("/target");
  });

  server.app.post("/target", async (c) => {
    c.json({
      source: "local server",
      header: c.req.header("x-test"),
      search: c.req.searchParam("search"),
      body: await c.req.json(),
      body2: await c.req.json(),
    });
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
  await targetServer.stop();
});

describe("responses - rewrite", () => {
  it("should return local rewrite response", async () => {
    const response = await fetch(server.url("/rewrite-local?search=local"), {
      method: "POST",
      headers: {
        "x-test": "test",
      },
      body: JSON.stringify({ hello: "world" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      source: "local server",
      header: "test",
      search: "local",
      body: { hello: "world" },
      body2: { hello: "world" },
    });
  });

  it("should return target rewrite response", async () => {
    const response = await fetch(
      server.url("/rewrite-external?search=external"),
      {
        method: "POST",
        headers: {
          "x-test": "test",
        },
        body: JSON.stringify({ hello: "world" }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      source: "target server",
      header: "test",
      search: "external",
      body: { hello: "world" },
    });
  });
});
