import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/", (c) => {
    c.html(
      `<!DOCTYPE html><html lang="en"><body><h1>Hello, World!</h1></body></html>`,
    );
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("responses - html", () => {
  it("should render jsx to html response", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/html; charset=UTF-8",
    );
    expect(await response.text()).toBe(
      '<!DOCTYPE html><html lang="en"><body><h1>Hello, World!</h1></body></html>',
    );
  });
});
