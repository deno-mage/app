import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../mod.ts";
import { MageTestServer } from "../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/file", (context) => {
    context.text(StatusCode.OK, context.asset("test/file.txt"));
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("asset", () => {
  it("provide cache busted asset filepath using build id", async () => {
    const response = await fetch(server.url("/file"));

    expect(await response.text()).toBe(`test/file.txt.${server.app.buildId}`);
  });
});
