import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/public/specific", (context) => {
    context.text(StatusCode.OK, "specific");
  });

  server.app.get("/public/*", (context) => {
    context.text(StatusCode.OK, "wildcard");
  });

  server.app.get("/:param/*", (context) => {
    context.json(StatusCode.OK, context.params);
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("routing - wildcard", () => {
  it("should hit route for wildcard base, wildcards are inclusive", async () => {
    const response = await fetch(server.url("/public"), {
      method: "GET",
    });

    expect(await response.text()).toBe("wildcard");
  });

  it("should hit route with wildcard", async () => {
    const response = await fetch(server.url("/public/wildcard"), {
      method: "GET",
    });

    expect(await response.text()).toBe("wildcard");
  });

  it("should hit route with wildcard with multiple paths", async () => {
    const response = await fetch(server.url("/public/js/index.js"), {
      method: "GET",
    });

    expect(await response.text()).toBe("wildcard");
  });

  it("should hit specific path if registered first over wildcard", async () => {
    const response = await fetch(server.url("/public/specific"), {
      method: "GET",
    });

    expect(await response.text()).toBe("specific");
  });

  it("should hit route with wildcard and extract params", async () => {
    const response = await fetch(server.url("/param/wildcard"), {
      method: "GET",
    });

    expect(await response.json()).toEqual({ param: "param" });
  });
});
