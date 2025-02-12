import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode, StatusText } from "@mage/app";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("routing - not found", () => {
  it("should send 404 when route not matched", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toEqual(StatusCode.NotFound);
    expect(await response.text()).toBe(StatusText.NotFound);
  });

  it("should not handle OPTIONS requests", async () => {
    const response = await fetch(server.url("/"), {
      method: "OPTIONS",
    });

    expect(response.status).toEqual(StatusCode.NoContent);
    expect(response.headers.get("Allow")).toBe("");
    expect(await response.text()).toBe("");
  });
});
