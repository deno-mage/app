import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/default", (c) => {
    c.redirect("/redirect/default");
  });

  server.app.get("/set-status", (c) => {
    c.redirect("/redirect/set-status", 308);
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("responses - redirect", () => {
  it("should return redirect response, default to 307", async () => {
    const response = await fetch(server.url("/default"), {
      method: "GET",
      redirect: "manual",
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("/redirect/default");
    expect(await response.text()).toBe("");
  });

  it("should return perm redirect response, set response", async () => {
    const response = await fetch(server.url("/set-status"), {
      method: "GET",
      redirect: "manual",
    });

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("/redirect/set-status");
    expect(await response.text()).toBe("");
  });
});
