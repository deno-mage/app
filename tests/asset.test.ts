import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "@mage/app";
import { MageTestServer } from "../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/file/file.txt", (context) => {
    context.text(StatusCode.OK, context.asset("/file/file.txt"));
  });

  server.app.get("/file/file", (context) => {
    context.text(StatusCode.OK, context.asset("/file/file"));
  });

  server.app.get("/file/file.temp.txt", (context) => {
    context.text(StatusCode.OK, context.asset("/file/file.temp.txt"));
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("asset", () => {
  it("provide cache busted asset filepath using build id - .txt", async () => {
    const response = await fetch(server.url("/file/file.txt"));

    expect(await response.text()).toBe(`/file/file-${server.app.buildId}.txt`);
  });

  it("provide cache busted asset filepath using build id - no extension", async () => {
    const response = await fetch(server.url("/file/file"));

    expect(await response.text()).toBe(`/file/file-${server.app.buildId}`);
  });

  it("provide cache busted asset filepath using build id - .temp.txt", async () => {
    const response = await fetch(server.url("/file/file.temp.txt"));

    expect(await response.text()).toBe(
      `/file/file.temp-${server.app.buildId}.txt`,
    );
  });
});
