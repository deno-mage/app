import { afterEach, beforeEach, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { middleware, StatusCode } from "../main.ts";
import { MageTestServer } from "./utils/server.ts";

let server: MageTestServer;

beforeEach(() => {
  server = new MageTestServer();

  server.app.use(middleware.useSecurityHeaders());

  server.app.get("/", (context) => {
    context.text(StatusCode.OK, "Hello, World!");
  });

  server.start();
});

afterEach(async () => {
  await server.stop();
});

it("should set security headers", async () => {
  const response = await fetch(server.url("/"), {
    method: "GET",
  });

  // drain response to ensure no memory leak
  await response.text();

  expect(response.headers.get("Content-Security-Policy")).toEqual(
    "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"
  );
  expect(response.headers.get("Cross-Origin-Opener-Policy")).toEqual(
    "same-origin"
  );
  expect(response.headers.get("Cross-Origin-Resource-Policy")).toEqual(
    "same-origin"
  );
  expect(response.headers.get("Origin-Agent-Cluster")).toEqual("?1");
  expect(response.headers.get("Referrer-Policy")).toEqual("no-referrer");
  expect(response.headers.get("Strict-Transport-Security")).toEqual(
    "max-age=15552000; includeSubDomains"
  );
  expect(response.headers.get("X-Content-Type-Options")).toEqual("nosniff");
  expect(response.headers.get("X-DNS-Prefetch-Control")).toEqual("off");
  expect(response.headers.get("X-Download-Options")).toEqual("noopen");
  expect(response.headers.get("X-Frame-Options")).toEqual("SAMEORIGIN");
  expect(response.headers.get("X-Permitted-Cross-Domain-Policies")).toEqual(
    "none"
  );
  expect(response.headers.get("X-XSS-Protection")).toEqual("0");
  expect(response.headers.get("X-Powered-By")).toBeNull();
});
