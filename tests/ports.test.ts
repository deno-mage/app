import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../mod.ts";
import { MageTestServer } from "../test-utils/server.ts";

let serverOne: MageTestServer;
let serverTwo: MageTestServer;

beforeAll(async () => {
  serverOne = new MageTestServer();

  serverOne.app.get("/", (context) => {
    context.text(StatusCode.OK, "Server One");
  });

  serverOne.start(38000);

  // give time for the server to obtain the port
  await new Promise((resolve) => setTimeout(resolve, 50));

  serverTwo = new MageTestServer();

  serverTwo.app.get("/", (context) => {
    context.text(StatusCode.OK, "Server Two");
  });

  serverTwo.start(38000);
});

afterAll(async () => {
  await serverOne.stop();
  await serverTwo.stop();
});

describe("ports", () => {
  it("should start on requested port if not taken", async () => {
    const url = serverOne.url("/");

    expect(url.port).toBe("38000");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Test": "test",
      },
    });

    expect(await response.text()).toBe("Server One");
  });

  it("should start on next available port", async () => {
    const url = serverTwo.url("/");

    expect(url.port).toBe("38001");

    const response = await fetch(serverTwo.url("/"), {
      method: "GET",
    });

    expect(await response.text()).toBe("Server Two");
  });
});
