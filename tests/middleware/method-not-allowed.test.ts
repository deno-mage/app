import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode, StatusText, useMethodNotAllowed } from "../../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.delete(
    "/",
    useMethodNotAllowed({
      getAllowedMethods: () => ["GET", "HEAD", "POST", "PUT"],
    }),
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("middleware - method not allowed", () => {
  it("should send 405 when method not matched", async () => {
    const response = await fetch(server.url("/"), {
      method: "DELETE",
    });

    expect(response.status).toEqual(StatusCode.MethodNotAllowed);
    expect(response.headers.get("Allow")).toBe("GET, HEAD, POST, PUT");
    expect(await response.text()).toBe(StatusText.MethodNotAllowed);
  });
});
