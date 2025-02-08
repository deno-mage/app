import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;
let targetServer: MageTestServer;

beforeAll(() => {
  targetServer = new MageTestServer();

  targetServer.app.post("/target", async (context) => {
    context.json(StatusCode.OK, {
      source: "target server",
      header: context.request.header("x-test"),
      search: context.request.searchParam("search"),
      body: await context.request.json(),
    });
  });

  targetServer.start();

  server = new MageTestServer();

  server.app.post("/rewrite-external", async (context) => {
    await context.rewrite(targetServer.url("/target").toString());
  });

  server.app.post("/rewrite-local", async (context) => {
    await context.rewrite("/target");
  });

  server.app.post("/target", async (context) => {
    context.json(StatusCode.OK, {
      source: "local server",
      header: context.request.header("x-test"),
      search: context.request.searchParam("search"),
      body: await context.request.json(),
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

    expect(response.status).toBe(StatusCode.OK);
    expect(await response.json()).toEqual({
      source: "local server",
      header: "test",
      search: "local",
      body: { hello: "world" },
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

    expect(response.status).toBe(StatusCode.OK);
    expect(await response.json()).toEqual({
      source: "target server",
      header: "test",
      search: "external",
      body: { hello: "world" },
    });
  });
});
