import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "@mage/app";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/", (context) => {
    context.empty(StatusCode.NoContent);
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("responses - empty", () => {
  it("should return empty response", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toBe(StatusCode.NoContent);
    expect(await response.text()).toBe("");
  });
});
