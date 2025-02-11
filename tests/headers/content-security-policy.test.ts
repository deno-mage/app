import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { contentSecurityPolicy, StatusCode } from "../../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get("/", (context) => {
    contentSecurityPolicy(context, {
      directives: {
        defaultSrc: "'self'",
        scriptSrc: ["'self'", "https://example.com"],
      },
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.get("/upgrade-insecure-requests/true", (context) => {
    contentSecurityPolicy(context, {
      directives: {
        defaultSrc: "'self'",
        upgradeInsecureRequests: true,
      },
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.app.get("/upgrade-insecure-requests/false", (context) => {
    contentSecurityPolicy(context, {
      directives: {
        defaultSrc: "'self'",
        upgradeInsecureRequests: false,
      },
    });

    context.text(StatusCode.OK, "Hello, World!");
  });

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("headers - content-security-policy", () => {
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
