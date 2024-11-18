import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/", (context) => {
    context.json(StatusCode.OK, { message: "Hello, World!" });
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("responses - json", () => {
  it("should return json response", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toBe(StatusCode.OK);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toEqual({ message: "Hello, World!" });
  });
});
