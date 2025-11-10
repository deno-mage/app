import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { csp } from "../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get(
    "/",
    csp({
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
    csp({
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
    csp({
      directives: {
        defaultSrc: "'self'",
        upgradeInsecureRequests: false,
      },
    }),
    (c) => {
      c.text("Hello, World!");
    },
  );

  server.app.get(
    "/dynamic",
    csp({
      directives: (c) => ({
        scriptSrc: ["'self'", `'nonce-${c.get<string>("cspNonce")}'`],
      }),
    }),
    (c) => {
      c.set("cspNonce", "abc123");
      c.text("Hello, World!");
    },
  );

  server.app.get(
    "/dynamic-with-context",
    (c, next) => {
      c.set("cspNonce", "xyz789");
      return next();
    },
    csp({
      directives: (c) => ({
        scriptSrc: ["'self'", `'nonce-${c.get<string>("cspNonce")}'`],
      }),
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

describe("csp", () => {
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

  it("should support dynamic CSP with function directives", async () => {
    const response = await fetch(server.url("/dynamic"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    // Should include the nonce that was set in context after CSP middleware
    // Note: In this test, the nonce is set AFTER csp middleware runs, so it won't be in the header
    // This demonstrates that dynamic CSP needs the data available before it runs
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "script-src 'self' 'nonce-undefined'",
    );
  });

  it("should support dynamic CSP with context set before middleware", async () => {
    const response = await fetch(server.url("/dynamic-with-context"), {
      method: "GET",
    });

    // drain response to ensure no memory leak
    await response.text();

    // Should include the nonce that was set in previous middleware
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "script-src 'self' 'nonce-xyz789'",
    );
  });
});
