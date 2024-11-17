import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode, StatusText } from "../../exports.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("middleware - not found", () => {
  it("should send 404 when route not matched", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toEqual(StatusCode.NotFound);
    expect(await response.text()).toBe(StatusText.NotFound);
  });
});
