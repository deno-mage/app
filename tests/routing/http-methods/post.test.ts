import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../../../app/mod.ts";
import { MageTestServer } from "../../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.post("/", (context) => {
    context.text(StatusCode.OK, "Hello, World!");
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

    expect(response.status).toBe(StatusCode.OK);
    expect(await response.text()).toBe("Hello, World!");
  });
});
