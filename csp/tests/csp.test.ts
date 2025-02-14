import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { useCSP } from "../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get(
    "/",
    useCSP({
      directives: {
        defaultSrc: "'self'",
        scriptSrc: ["'self'", "https://example.com"],
      },
    }),
    (c) => {
      c.text("Hello, World!");
    },
  );

  server.app.get(
    "/upgrade-insecure-requests/true",
    useCSP({
      directives: {
        defaultSrc: "'self'",
        upgradeInsecureRequests: true,
      },
    }),
    (c) => {
      c.text("Hello, World!");
    },
  );

  server.app.get(
    "/upgrade-insecure-requests/false",
    useCSP({
      directives: {
        defaultSrc: "'self'",
        upgradeInsecureRequests: false,
      },
    }),
    (c) => {
      c.text("Hello, World!");
    },
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("headers - csp", () => {
  it("should set security headers", async () => {
    const response = await fetch(server.url("/"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Content-Security-Policy")).toEqual(
      "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self' https://example.com;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
    );
  });

  it("should set security headers with upgrade-insecure-requests", async () => {
    const response = await fetch(
      server.url("/upgrade-insecure-requests/true"),
      {
        method: "GET",
      },
    );

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Content-Security-Policy")).toEqual(
      "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
    );
  });

  it("should not set security headers with upgrade-insecure-requests", async () => {
    const response = await fetch(
      server.url("/upgrade-insecure-requests/false"),
      {
        method: "GET",
      },
    );

    // drain response to ensure no memory leak
    await response.text();

    expect(response.headers.get("Content-Security-Policy")).toEqual(
      "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline'",
    );
  });
});
