import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "@mage/app";
import { MageTestServer } from "../../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/", (context) => {
    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.head("/custom", (context) => {
    context.text(StatusCode.OK, "Goodbye, World!");
  });

  server.app.get("/custom", (context) => {
    context.text(StatusCode.OK, "Hello, World!");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("routing - HTTP methods - head", () => {
  it("should process as GET but not return body", async () => {
    const response = await fetch(server.url("/"), {
      method: "HEAD",
    });

    expect(response.status).toBe(StatusCode.OK);
    expect(response.headers.get("Content-Length")).toBe("13");
    expect(await response.text()).toBe("");
  });

  it("should return custon head response", async () => {
    const response = await fetch(server.url("/custom"), {
      method: "HEAD",
    });

    expect(response.status).toBe(StatusCode.OK);
    expect(response.headers.get("Content-Length")).toBe("15");
    expect(await response.text()).toBe("");
  });
});
