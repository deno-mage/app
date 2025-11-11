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

  targetServer.app.get("/path/with/query", (c) => {
    c.json({
      source: "target server",
      queryParam: c.req.searchParam("target"),
      originalParam: c.req.searchParam("original"),
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

  server.app.get("/rewrite-with-query", async (c) => {
    await c.rewrite("/target");
  });

  server.app.get("/rewrite-url-object", async (c) => {
    await c.rewrite(new URL(targetServer.url("/path/with/query?target=value")));
  });

  server.app.get("/rewrite-absolute-with-query", async (c) => {
    await c.rewrite(
      targetServer.url("/path/with/query?target=value").toString(),
    );
  });

  server.app.get("/rewrite-absolute-no-query", async (c) => {
    await c.rewrite(targetServer.url("/path/with/query").toString());
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

  server.app.get("/target", (c) => {
    c.json({
      source: "local server",
      search: c.req.searchParam("original"),
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

  it("should preserve query string with relative path rewrite", async () => {
    const response = await fetch(
      server.url("/rewrite-with-query?original=param"),
      {
        method: "GET",
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      source: "local server",
      search: "param",
    });
  });

  it("should use target URL query string when provided (URL object)", async () => {
    const response = await fetch(
      server.url("/rewrite-url-object?original=ignored"),
      {
        method: "GET",
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      source: "target server",
      queryParam: "value",
      originalParam: null,
    });
  });

  it("should use target URL query string when provided (string)", async () => {
    const response = await fetch(
      server.url("/rewrite-absolute-with-query?original=ignored"),
      {
        method: "GET",
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      source: "target server",
      queryParam: "value",
      originalParam: null,
    });
  });

  it("should preserve original query string when target has none", async () => {
    const response = await fetch(
      server.url("/rewrite-absolute-no-query?original=preserved"),
      {
        method: "GET",
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      source: "target server",
      queryParam: null,
      originalParam: "preserved",
    });
  });
});
