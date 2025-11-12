import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageTestServer } from "../../test-utils/server.ts";
import { deleteCookie, getCookie, setCookie } from "../mod.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/get", async (c) => {
    const cookie = await getCookie(c, "get-cookie");

    c.text(cookie!);
  });

  server.app.get("/set", async (c) => {
    await setCookie(c, "set-cookie", "123");
  });

  server.app.get("/delete", (c) => {
    deleteCookie(c, "delete-cookie");
  });

  server.app.get("/set-options", async (c) => {
    await setCookie(c, "set-cookie", "123", {
      domain: "example.com",
      expires: new Date("2024-01-01"),
      httpOnly: true,
      maxAge: 60,
      path: "/",
      sameSite: "Strict",
      secure: true,
    });
  });

  server.app.get("/get-null", async (c) => {
    const cookie = await getCookie(c, "null-cookie");

    c.text(cookie!);
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("cookies", () => {
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

  it("should get null if cookie is not set (no cookies)", async () => {
    const response = await fetch(server.url("/get-null"), {
      method: "GET",
    });

    expect(await response.text()).toBe("");
  });

  it("should get null if cookie is not set (some cookies)", async () => {
    const response = await fetch(server.url("/get-null"), {
      method: "GET",
      headers: {
        Cookie: "not-null-cookie=123",
      },
    });

    expect(await response.text()).toBe("");
  });

  it("should handle cookie values with equals signs", async () => {
    const response = await fetch(server.url("/get"), {
      method: "GET",
      headers: {
        Cookie: "get-cookie=a=b=c",
      },
    });

    expect(await response.text()).toBe("a=b=c");
  });

  it("should handle cookie values with multiple equals signs", async () => {
    const response = await fetch(server.url("/get"), {
      method: "GET",
      headers: {
        Cookie: "get-cookie=key1=value1&key2=value2",
      },
    });

    expect(await response.text()).toBe("key1=value1&key2=value2");
  });

  it("should handle quoted cookie values", async () => {
    const response = await fetch(server.url("/get"), {
      method: "GET",
      headers: {
        Cookie: 'get-cookie="quoted value"',
      },
    });

    expect(await response.text()).toBe("quoted value");
  });

  it("should handle quoted cookie values with equals signs", async () => {
    const response = await fetch(server.url("/get"), {
      method: "GET",
      headers: {
        Cookie: 'get-cookie="a=b=c"',
      },
    });

    expect(await response.text()).toBe("a=b=c");
  });

  it("should handle cookie values with special characters", async () => {
    const response = await fetch(server.url("/get"), {
      method: "GET",
      headers: {
        Cookie: "get-cookie=hello%20world",
      },
    });

    expect(await response.text()).toBe("hello%20world");
  });

  it("should handle empty cookie values", async () => {
    const response = await fetch(server.url("/get"), {
      method: "GET",
      headers: {
        Cookie: "get-cookie=",
      },
    });

    expect(await response.text()).toBe("");
  });

  it("should handle cookie with multiple cookies in header", async () => {
    const response = await fetch(server.url("/get"), {
      method: "GET",
      headers: {
        Cookie: "first=1; get-cookie=target-value; last=3",
      },
    });

    expect(await response.text()).toBe("target-value");
  });

  it("should handle cookie with equals in value among multiple cookies", async () => {
    const response = await fetch(server.url("/get"), {
      method: "GET",
      headers: {
        Cookie: "first=1; get-cookie=a=b; last=3",
      },
    });

    expect(await response.text()).toBe("a=b");
  });
});
