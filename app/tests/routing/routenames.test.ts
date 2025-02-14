import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/", (c) => {
    c.text("base");
  });

  server.app.get("/one", (c) => {
    c.text("one");
  });

  server.app.get("/one/two", (c) => {
    c.text("two");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("routing - route names", () => {
  it("should hit base route ", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    expect(await response.text()).toBe("base");
  });

  it("should hit route one", async () => {
    const response = await fetch(server.url("/one"), {
      method: "GET",
    });

    expect(await response.text()).toBe("one");
  });

  it("should hit route two", async () => {
    const response = await fetch(server.url("/one/two"), {
      method: "GET",
    });

    expect(await response.text()).toBe("two");
  });
});
