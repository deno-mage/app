import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { cacheControl, StatusCode } from "../../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/", (context) => {
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

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("headers - cache-control", () => {
  it("should set cache control headers", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Cache-Control")).toEqual(
      "max-age=60, s-maxage=60, no-cache, no-store, no-transform, must-revalidate, proxy-revalidate, must-understand, private, public, immutable, stale-while-revalidate=60, stale-if-error=60",
    );
  });
});
