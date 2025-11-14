import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { securityHeaders } from "../mod.ts";
import { MageTestServer } from "../../test-utils/server.ts";

describe("security headers", () => {
  describe("default configuration", () => {
    let server: MageTestServer;

    beforeAll(() => {
      server = new MageTestServer();

      server.app.use(securityHeaders());

      server.app.get("/", (c) => {
        c.text("Hello, World!");
      });

      server.start();
    });

    afterAll(async () => {
      await server.stop();
    });

    it("should set default security headers", async () => {
      const response = await fetch(server.url("/"), {
        method: "GET",
      });

      // drain response to ensure no memory leak
      await response.text();

      expect(response.headers.get("Content-Security-Policy")).toEqual(
        "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
      );
      expect(response.headers.get("Cross-Origin-Opener-Policy")).toEqual(
        "same-origin",
      );
      expect(response.headers.get("Cross-Origin-Resource-Policy")).toEqual(
        "same-origin",
      );
      expect(response.headers.get("Origin-Agent-Cluster")).toEqual("?1");
      expect(response.headers.get("Referrer-Policy")).toEqual("no-referrer");
      expect(response.headers.get("Strict-Transport-Security")).toEqual(
        "max-age=15552000; includeSubDomains",
      );
      expect(response.headers.get("X-Content-Type-Options")).toEqual("nosniff");
      expect(response.headers.get("X-DNS-Prefetch-Control")).toEqual("off");
      expect(response.headers.get("X-Download-Options")).toEqual("noopen");
      expect(response.headers.get("X-Frame-Options")).toEqual("SAMEORIGIN");
      expect(response.headers.get("X-Permitted-Cross-Domain-Policies")).toEqual(
        "none",
      );
      expect(response.headers.get("X-XSS-Protection")).toEqual("0");
      expect(response.headers.get("X-Powered-By")).toBeNull();
    });
  });

  describe("custom configuration", () => {
    let server: MageTestServer;

    beforeAll(() => {
      server = new MageTestServer();

      server.app.use(securityHeaders({
        referrerPolicy: "strict-origin-when-cross-origin",
        xFrameOptions: "DENY",
        xDnsPrefetchControl: true,
        crossOriginOpenerPolicy: "same-origin-allow-popups",
        crossOriginResourcePolicy: "cross-origin",
        xContentTypeOptions: false,
        xDownloadOptions: false,
        originAgentCluster: false,
        removeXPoweredBy: false,
        xXssProtection: "1; mode=block",
        strictTransportSecurity: "max-age=31536000",
        xPermittedCrossDomainPolicies: "master-only",
      }));

      server.app.get("/", (c) => {
        // Set X-Powered-By to test that it's not removed
        c.header("X-Powered-By", "Mage");
        c.text("Hello, World!");
      });

      server.start();
    });

    afterAll(async () => {
      await server.stop();
    });

    it("should set custom security headers", async () => {
      const response = await fetch(server.url("/"), {
        method: "GET",
      });

      // drain response to ensure no memory leak
      await response.text();

      expect(response.headers.get("Referrer-Policy")).toEqual(
        "strict-origin-when-cross-origin",
      );
      expect(response.headers.get("X-Frame-Options")).toEqual("DENY");
      expect(response.headers.get("X-DNS-Prefetch-Control")).toEqual("on");
      expect(response.headers.get("Cross-Origin-Opener-Policy")).toEqual(
        "same-origin-allow-popups",
      );
      expect(response.headers.get("Cross-Origin-Resource-Policy")).toEqual(
        "cross-origin",
      );
      expect(response.headers.get("X-Content-Type-Options")).toBeNull();
      expect(response.headers.get("X-Download-Options")).toBeNull();
      expect(response.headers.get("Origin-Agent-Cluster")).toBeNull();
      expect(response.headers.get("X-Powered-By")).toEqual("Mage");
      expect(response.headers.get("X-XSS-Protection")).toEqual("1; mode=block");
      expect(response.headers.get("Strict-Transport-Security")).toEqual(
        "max-age=31536000",
      );
      expect(response.headers.get("X-Permitted-Cross-Domain-Policies")).toEqual(
        "master-only",
      );
    });
  });

  describe("Permissions-Policy configuration", () => {
    let server: MageTestServer;

    beforeAll(() => {
      server = new MageTestServer();

      server.app.use(securityHeaders({
        permissionsPolicy: {
          geolocation: ["self"],
          camera: ["none"],
          microphone: ["self", "https://example.com"],
          payment: [],
        },
      }));

      server.app.get("/", (c) => {
        c.text("Hello, World!");
      });

      server.start();
    });

    afterAll(async () => {
      await server.stop();
    });

    it("should set Permissions-Policy header", async () => {
      const response = await fetch(server.url("/"), {
        method: "GET",
      });

      // drain response to ensure no memory leak
      await response.text();

      expect(response.headers.get("Permissions-Policy")).toEqual(
        'geolocation=(self), camera=(), microphone=(self "https://example.com"), payment=()',
      );
    });
  });

  describe("CSP configuration", () => {
    let server: MageTestServer;

    beforeAll(() => {
      server = new MageTestServer();

      server.app.use(securityHeaders({
        csp: {
          directives: {
            defaultSrc: ["'self'", "https://example.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
          },
        },
      }));

      server.app.get("/", (c) => {
        c.text("Hello, World!");
      });

      server.start();
    });

    afterAll(async () => {
      await server.stop();
    });

    it("should set custom CSP header", async () => {
      const response = await fetch(server.url("/"), {
        method: "GET",
      });

      // drain response to ensure no memory leak
      await response.text();

      expect(response.headers.get("Content-Security-Policy")).toEqual(
        "default-src 'self' https://example.com;base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self' 'unsafe-inline';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
      );
    });
  });
});
