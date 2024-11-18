import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode, useOptions } from "../../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.options(
    useOptions({
      getAllowedMethods: () => ["DELETE", "GET", "HEAD"],
    }),
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("middleware - HTTP methods - options", () => {
  it("should return correct response (has methods)", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toBe(StatusCode.NoContent);
    expect(response.headers.get("allow")).toBe("DELETE, GET, HEAD");
  });
});
