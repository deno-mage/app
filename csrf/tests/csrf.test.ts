import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { csrf } from "../middleware.ts";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  // Safe methods - GET
  server.app.get("/safe-get", csrf(), (c) => c.text("ok"));

  // Safe methods - HEAD (uses same route as GET)

  // POST with JSON (non-form content type, should bypass CSRF)
  server.app.post("/json", csrf(), (c) => c.text("ok"));

  // POST with form content type - no headers (should block)
  server.app.post("/form-no-headers", csrf(), (c) => c.text("ok"));

  // POST with form content type - same-origin sec-fetch-site
  server.app.post("/form-same-origin", csrf(), (c) => c.text("ok"));

  // POST with form content type - matching origin
  server.app.post("/form-matching-origin", csrf(), (c) => c.text("ok"));

  // POST with form content type - cross-site (should block)
  server.app.post("/form-cross-site", csrf(), (c) => c.text("ok"));

  // multipart/form-data (should block without headers)
  server.app.post("/multipart", csrf(), (c) => c.text("ok"));

  // text/plain (should block without headers)
  server.app.post("/text-plain", csrf(), (c) => c.text("ok"));

  // Custom origin - string
  server.app.post(
    "/custom-origin-string",
    csrf({ origin: "https://example.com" }),
    (c) => c.text("ok"),
  );

  // Custom origin - array
  server.app.post(
    "/custom-origin-array",
    csrf({ origin: ["https://example.com", "https://app.example.com"] }),
    (c) => c.text("ok"),
  );

  // Custom origin - function
  server.app.post(
    "/custom-origin-function",
    csrf({
      origin: (origin, ctx) => {
        return origin === ctx.req.url.origin ||
          origin.endsWith(".trusted.com");
      },
    }),
    (c) => c.text("ok"),
  );

  // Custom secFetchSite - string
  server.app.post(
    "/custom-sec-fetch-site-string",
    csrf({ secFetchSite: "same-site" }),
    (c) => c.text("ok"),
  );

  // Custom secFetchSite - array
  server.app.post(
    "/custom-sec-fetch-site-array",
    csrf({ secFetchSite: ["same-origin", "same-site"] }),
    (c) => c.text("ok"),
  );

  // Custom secFetchSite - function
  server.app.post(
    "/webhook/test",
    csrf({
      secFetchSite: (site, ctx) => {
        if (site === "same-origin") return true;
        if (ctx.req.url.href.includes("/webhook/")) return true;
        return false;
      },
    }),
    (c) => c.text("webhook"),
  );
  server.app.post(
    "/regular",
    csrf({
      secFetchSite: (site, ctx) => {
        if (site === "same-origin") return true;
        if (ctx.req.url.href.includes("/webhook/")) return true;
        return false;
      },
    }),
    (c) => c.text("ok"),
  );

  server.start();
});

afterAll(async () => {
  await server.stop();
});

describe("csrf middleware", () => {
  describe("safe methods", () => {
    it("should allow GET requests without validation", async () => {
      const response = await fetch(server.url("/safe-get"));
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("ok");
    });

    it("should allow HEAD requests without validation", async () => {
      const response = await fetch(server.url("/safe-get"), {
        method: "HEAD",
      });
      expect(response.status).toBe(200);
    });
  });

  describe("unsafe methods with non-form content types", () => {
    it("should allow POST with application/json", async () => {
      const response = await fetch(server.url("/json"), {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ test: "data" }),
      });
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("ok");
    });

    it("should allow POST with non-form content-type (application/octet-stream)", async () => {
      const response = await fetch(server.url("/json"), {
        method: "POST",
        headers: {
          "content-type": "application/octet-stream",
        },
        body: new Uint8Array([1, 2, 3]),
      });
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("ok");
    });
  });

  describe("unsafe methods with form content types", () => {
    describe("default configuration (same-origin only)", () => {
      it("should block POST with application/x-www-form-urlencoded and no headers", async () => {
        const response = await fetch(server.url("/form-no-headers"), {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
          body: "test=data",
        });
        expect(response.status).toBe(403);
        await response.text(); // Consume body
      });

      it("should allow POST with same-origin via sec-fetch-site", async () => {
        const response = await fetch(server.url("/form-same-origin"), {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "sec-fetch-site": "same-origin",
          },
          body: "test=data",
        });
        expect(response.status).toBe(200);
        expect(await response.text()).toBe("ok");
      });

      it("should allow POST with matching origin", async () => {
        const response = await fetch(server.url("/form-matching-origin"), {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "origin": server.url("/").origin,
          },
          body: "test=data",
        });
        expect(response.status).toBe(200);
        expect(await response.text()).toBe("ok");
      });

      it("should block POST with cross-site sec-fetch-site and mismatched origin", async () => {
        const response = await fetch(server.url("/form-cross-site"), {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "sec-fetch-site": "cross-site",
            "origin": "http://evil.com",
          },
          body: "test=data",
        });
        expect(response.status).toBe(403);
        await response.text(); // Consume body
      });

      it("should block POST with multipart/form-data without headers", async () => {
        const response = await fetch(server.url("/multipart"), {
          method: "POST",
          headers: {
            "content-type": "multipart/form-data",
          },
          body: "test=data",
        });
        expect(response.status).toBe(403);
        await response.text(); // Consume body
      });

      it("should allow POST with multipart/form-data and same-origin", async () => {
        const response = await fetch(server.url("/multipart"), {
          method: "POST",
          headers: {
            "content-type": "multipart/form-data",
            "sec-fetch-site": "same-origin",
          },
          body: "test=data",
        });
        expect(response.status).toBe(200);
        expect(await response.text()).toBe("ok");
      });

      it("should block POST with text/plain", async () => {
        const response = await fetch(server.url("/text-plain"), {
          method: "POST",
          headers: {
            "content-type": "text/plain",
          },
          body: "test data",
        });
        expect(response.status).toBe(403);
        await response.text(); // Consume body
      });
    });

    describe("custom origin (string)", () => {
      it("should allow matching origin", async () => {
        const response = await fetch(server.url("/custom-origin-string"), {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "origin": "https://example.com",
          },
          body: "test=data",
        });
        expect(response.status).toBe(200);
        expect(await response.text()).toBe("ok");
      });

      it("should block non-matching origin", async () => {
        const response = await fetch(server.url("/custom-origin-string"), {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "origin": "https://evil.com",
          },
          body: "test=data",
        });
        expect(response.status).toBe(403);
        await response.text(); // Consume body
      });
    });

    describe("custom origin (array)", () => {
      it("should allow any matching origin", async () => {
        const response1 = await fetch(server.url("/custom-origin-array"), {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "origin": "https://example.com",
          },
          body: "test=data",
        });
        expect(response1.status).toBe(200);
        await response1.text(); // Consume body

        const response2 = await fetch(server.url("/custom-origin-array"), {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "origin": "https://app.example.com",
          },
          body: "test=data",
        });
        expect(response2.status).toBe(200);
        await response2.text(); // Consume body
      });

      it("should block non-matching origin", async () => {
        const response = await fetch(server.url("/custom-origin-array"), {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "origin": "https://evil.com",
          },
          body: "test=data",
        });
        expect(response.status).toBe(403);
        await response.text(); // Consume body
      });
    });

    describe("custom origin (function)", () => {
      it("should use custom validation logic", async () => {
        const response1 = await fetch(server.url("/custom-origin-function"), {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "origin": server.url("/").origin,
          },
          body: "test=data",
        });
        expect(response1.status).toBe(200);
        await response1.text(); // Consume body

        const response2 = await fetch(server.url("/custom-origin-function"), {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "origin": "https://app.trusted.com",
          },
          body: "test=data",
        });
        expect(response2.status).toBe(200);
        await response2.text(); // Consume body

        const response3 = await fetch(server.url("/custom-origin-function"), {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "origin": "https://evil.com",
          },
          body: "test=data",
        });
        expect(response3.status).toBe(403);
        await response3.text(); // Consume body
      });
    });

    describe("custom secFetchSite (string)", () => {
      it("should allow matching sec-fetch-site", async () => {
        const response = await fetch(
          server.url("/custom-sec-fetch-site-string"),
          {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "sec-fetch-site": "same-site",
            },
            body: "test=data",
          },
        );
        expect(response.status).toBe(200);
        expect(await response.text()).toBe("ok");
      });

      it("should block non-matching sec-fetch-site", async () => {
        const response = await fetch(
          server.url("/custom-sec-fetch-site-string"),
          {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "sec-fetch-site": "cross-site",
            },
            body: "test=data",
          },
        );
        expect(response.status).toBe(403);
        await response.text(); // Consume body
      });
    });

    describe("custom secFetchSite (array)", () => {
      it("should allow any matching sec-fetch-site", async () => {
        const response1 = await fetch(
          server.url("/custom-sec-fetch-site-array"),
          {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "sec-fetch-site": "same-origin",
            },
            body: "test=data",
          },
        );
        expect(response1.status).toBe(200);
        await response1.text(); // Consume body

        const response2 = await fetch(
          server.url("/custom-sec-fetch-site-array"),
          {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "sec-fetch-site": "same-site",
            },
            body: "test=data",
          },
        );
        expect(response2.status).toBe(200);
        await response2.text(); // Consume body
      });

      it("should block non-matching sec-fetch-site", async () => {
        const response = await fetch(
          server.url("/custom-sec-fetch-site-array"),
          {
            method: "POST",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
              "sec-fetch-site": "cross-site",
            },
            body: "test=data",
          },
        );
        expect(response.status).toBe(403);
        await response.text(); // Consume body
      });
    });

    describe("custom secFetchSite (function)", () => {
      it("should use custom validation logic", async () => {
        const response1 = await fetch(server.url("/regular"), {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "sec-fetch-site": "same-origin",
          },
          body: "test=data",
        });
        expect(response1.status).toBe(200);
        await response1.text(); // Consume body

        const response2 = await fetch(server.url("/webhook/test"), {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "sec-fetch-site": "cross-site",
          },
          body: "test=data",
        });
        expect(response2.status).toBe(200);
        await response2.text(); // Consume body

        const response3 = await fetch(server.url("/regular"), {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "sec-fetch-site": "cross-site",
          },
          body: "test=data",
        });
        expect(response3.status).toBe(403);
        await response3.text(); // Consume body
      });
    });
  });
});
