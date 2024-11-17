import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../../../exports.ts";
import { MageTestServer } from "../../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.delete("/", (context) => {
    context.text(StatusCode.OK, "delete");
  });

  server.app.get("/", (context) => {
    context.text(StatusCode.OK, "get");
  });

  server.app.options("/custom", (context) => {
    context.empty(StatusCode.NoContent);
    context.response.headers.set("Allow", "CUSTUM");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("routing - HTTP methods - options", () => {
  it("should return correct response (has methods)", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toBe(StatusCode.NoContent);
    expect(response.headers.get("allow")).toBe("DELETE, GET, HEAD");
  });

  it("should return correct response (no methods)", async () => {
    const response = await fetch(server.url("/foo"), {
      method: "OPTIONS",
    });

    expect(response.status).toBe(StatusCode.NoContent);
    expect(response.headers.get("allow")).toBe("");
  });

  it("should return correct response (custom)", async () => {
    const response = await fetch(server.url("/custom"), {
      method: "OPTIONS",
    });

    expect(response.status).toBe(StatusCode.NoContent);
    expect(response.headers.get("allow")).toBe("CUSTUM");
  });
});
