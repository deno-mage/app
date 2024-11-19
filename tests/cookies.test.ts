import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../test-utils/server.ts";
import { StatusCode } from "../src/http.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/get", (context) => {
    const cookie = context.getCookie("get-cookie");

    context.text(StatusCode.OK, cookie!);
  });

  server.app.get("/set", (context) => {
    context.setCookie("set-cookie", "123");
  });

  server.app.get("/delete", (context) => {
    context.deleteCookie("delete-cookie");
  });

  server.app.get("/set-options", (context) => {
    context.setCookie("set-cookie", "123", {
      domain: "example.com",
      expires: new Date("2024-01-01"),
      httpOnly: true,
      maxAge: 60,
      path: "/",
      sameSite: "Strict",
      secure: true,
    });
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("headers", () => {
  it("should get cookie", async () => {
    const response = await fetch(server.url("/get"), {
      method: "GET",
      headers: {
        Cookie: "get-cookie=123",
      },
    });

    expect(await response.text()).toBe("123");
  });

  it("should set cookie", async () => {
    const response = await fetch(server.url("/set"), {
      method: "GET",
    });

    expect(response.headers.getSetCookie()).toEqual(["set-cookie=123"]);
  });

  it("should delete cookie", async () => {
    const response = await fetch(server.url("/delete"), {
      method: "GET",
    });

    expect(response.headers.getSetCookie()).toEqual([
      "delete-cookie=; Max-Age=0",
    ]);
  });

  it("should set cookie with options", async () => {
    const response = await fetch(server.url("/set-options"), {
      method: "GET",
    });

    expect(response.headers.getSetCookie()).toEqual([
      `set-cookie=123; Max-Age=60; Expires=${
        new Date(
          "2024-01-01",
        ).toUTCString()
      }; Path=/; Domain=example.com; Secure; HttpOnly; SameSite=Strict`,
    ]);
  });
});
