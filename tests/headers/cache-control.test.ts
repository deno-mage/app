import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { cacheControl, StatusCode } from "../../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/all", (context) => {
    cacheControl(context, {
      immutable: true,
      maxAge: 60,
      mustRevalidate: true,
      mustUnderstand: true,
      noCache: true,
      noStore: true,
      noTransform: true,
      proxyRevalidate: true,
      public: true,
      private: true,
      sMaxAge: 60,
      staleIfError: 60,
      staleWhileRevalidate: 60,
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.get("/immutable", (context) => {
    cacheControl(context, {
      immutable: true,
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.get("/max-age", (context) => {
    cacheControl(context, {
      maxAge: 60,
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.get("/must-revalidate", (context) => {
    cacheControl(context, {
      mustRevalidate: true,
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.get("/must-understand", (context) => {
    cacheControl(context, {
      mustUnderstand: true,
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.get("/no-cache", (context) => {
    cacheControl(context, {
      noCache: true,
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.get("/no-store", (context) => {
    cacheControl(context, {
      noStore: true,
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.get("/no-transform", (context) => {
    cacheControl(context, {
      noTransform: true,
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.get("/proxy-revalidate", (context) => {
    cacheControl(context, {
      proxyRevalidate: true,
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.get("/public", (context) => {
    cacheControl(context, {
      public: true,
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.get("/private", (context) => {
    cacheControl(context, {
      private: true,
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.get("/s-max-age", (context) => {
    cacheControl(context, {
      sMaxAge: 60,
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.get("/stale-if-error", (context) => {
    cacheControl(context, {
      staleIfError: 60,
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.get("/stale-while-revalidate", (context) => {
    cacheControl(context, {
      staleWhileRevalidate: 60,
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("headers - cache-control", () => {
  it("should set cache control header (all)", async () => {
    const response = await fetch(server.url("/all"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Cache-Control")).toEqual(
      "max-age=60, s-maxage=60, no-cache, no-store, no-transform, must-revalidate, proxy-revalidate, must-understand, private, public, immutable, stale-while-revalidate=60, stale-if-error=60",
    );
  });

  it("should set cache control header (immutable)", async () => {
    const response = await fetch(server.url("/immutable"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Cache-Control")).toEqual("immutable");
  });

  it("should set cache control header (max-age)", async () => {
    const response = await fetch(server.url("/max-age"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Cache-Control")).toEqual("max-age=60");
  });

  it("should set cache control header (must-revalidate)", async () => {
    const response = await fetch(server.url("/must-revalidate"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Cache-Control")).toEqual("must-revalidate");
  });

  it("should set cache control header (must-understand)", async () => {
    const response = await fetch(server.url("/must-understand"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Cache-Control")).toEqual("must-understand");
  });

  it("should set cache control header (no-cache)", async () => {
    const response = await fetch(server.url("/no-cache"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Cache-Control")).toEqual("no-cache");
  });

  it("should set cache control header (no-store)", async () => {
    const response = await fetch(server.url("/no-store"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Cache-Control")).toEqual("no-store");
  });

  it("should set cache control header (no-transform)", async () => {
    const response = await fetch(server.url("/no-transform"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Cache-Control")).toEqual("no-transform");
  });

  it("should set cache control header (proxy-revalidate)", async () => {
    const response = await fetch(server.url("/proxy-revalidate"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Cache-Control")).toEqual("proxy-revalidate");
  });

  it("should set cache control header (public)", async () => {
    const response = await fetch(server.url("/public"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Cache-Control")).toEqual("public");
  });

  it("should set cache control header (private)", async () => {
    const response = await fetch(server.url("/private"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Cache-Control")).toEqual("private");
  });

  it("should set cache control header (s-max-age)", async () => {
    const response = await fetch(server.url("/s-max-age"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Cache-Control")).toEqual("s-maxage=60");
  });

  it("should set cache control header (stale-if-error)", async () => {
    const response = await fetch(server.url("/stale-if-error"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Cache-Control")).toEqual("stale-if-error=60");
  });

  it("should set cache control header (stale-while-revalidate)", async () => {
    const response = await fetch(server.url("/stale-while-revalidate"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Cache-Control")).toEqual(
      "stale-while-revalidate=60",
    );
  });
});
