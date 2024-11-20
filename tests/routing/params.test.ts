import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "../../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/book/:id", (context) => {
    context.json(StatusCode.OK, context.params);
  });

  server.app.get("/countries/:country/:city/:road", (context) => {
    context.json(StatusCode.OK, context.params);
  });

  server.app.get("/public/*", (context) => {
    context.text(StatusCode.OK, "public");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("routing - params", () => {
  it("should hit route with params", async () => {
    const response = await fetch(server.url("/book/1"), {
      method: "GET",
    });

    expect(await response.json()).toEqual({ id: "1" });
  });

  it("should hit route with multiple params", async () => {
    const response = await fetch(
      server.url("/countries/usa/new-york/5th-avenue"),
      {
        method: "GET",
      },
    );

    expect(await response.json()).toEqual({
      country: "usa",
      city: "new-york",
      road: "5th-avenue",
    });
  });

  it("should return not found for wildcard base, wildcards not inclusive", async () => {
    const response = await fetch(server.url("/public"), {
      method: "GET",
    });

    expect(await response.text()).toBe("public");
  });

  it("should hit route with wildcard", async () => {
    const response = await fetch(server.url("/public/index.html"), {
      method: "GET",
    });

    expect(await response.text()).toBe("public");
  });

  it("should hit route with wildcard", async () => {
    const response = await fetch(server.url("/public/js/index.js"), {
      method: "GET",
    });

    expect(await response.text()).toBe("public");
  });
});
