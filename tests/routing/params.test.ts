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

  server.app.get("/user/:id/post/:postId", (context) => {
    context.json(StatusCode.OK, context.params);
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

  it("should hit route with multiple detached params", async () => {
    const response = await fetch(server.url("/user/1/post/2"), {
      method: "GET",
    });

    expect(await response.json()).toEqual({
      id: "1",
      postId: "2",
    });
  });
});
