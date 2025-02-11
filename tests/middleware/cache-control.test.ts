import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { StatusCode } from "@mage/app";
import { useCacheControl } from "@mage/middlewares";
import { MageTestServer } from "../../test-utils/server.ts";

let server: MageTestServer;

beforeAll(() => {
  server = new MageTestServer();

  server.app.get(
    "/all",
    useCacheControl({
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
    }),
    (context) => {
      context.text(StatusCode.OK, "Hello, World!");
    },
  );

  server.app.get(
    "/immutable",
    useCacheControl({
      immutable: true,
    }),
    (context) => {
      context.text(StatusCode.OK, "Hello, World!");
    },
  );

  server.app.get(
    "/max-age",
    useCacheControl({
      maxAge: 60,
    }),
    (context) => {
      context.text(StatusCode.OK, "Hello, World!");
    },
  );

  server.app.get(
    "/must-revalidate",
    useCacheControl({
      mustRevalidate: true,
    }),
    (context) => {
      context.text(StatusCode.OK, "Hello, World!");
    },
  );

  server.app.get(
    "/must-understand",
    useCacheControl({
      mustUnderstand: true,
    }),
    (context) => {
      context.text(StatusCode.OK, "Hello, World!");
    },
  );

  server.app.get(
    "/no-cache",
    useCacheControl({
      noCache: true,
    }),
    (context) => {
      context.text(StatusCode.OK, "Hello, World!");
    },
  );

  server.app.get(
    "/no-store",
    useCacheControl({
      noStore: true,
    }),
    (context) => {
      context.text(StatusCode.OK, "Hello, World!");
    },
  );

  server.app.get(
    "/no-transform",
    useCacheControl({
      noTransform: true,
    }),
    (context) => {
      context.text(StatusCode.OK, "Hello, World!");
    },
  );

  server.app.get(
    "/proxy-revalidate",
    useCacheControl({
      proxyRevalidate: true,
    }),
    (context) => {
      context.text(StatusCode.OK, "Hello, World!");
    },
  );

  server.app.get(
    "/public",
    useCacheControl({
      public: true,
    }),
    (context) => {
      context.text(StatusCode.OK, "Hello, World!");
    },
  );

  server.app.get(
    "/private",
    useCacheControl({
      private: true,
    }),
    (context) => {
      context.text(StatusCode.OK, "Hello, World!");
    },
  );

  server.app.get(
    "/s-max-age",
    useCacheControl({
      sMaxAge: 60,
    }),
    (context) => {
      context.text(StatusCode.OK, "Hello, World!");
    },
  );

  server.app.get(
    "/stale-if-error",
    useCacheControl({
      staleIfError: 60,
    }),
    (context) => {
      context.text(StatusCode.OK, "Hello, World!");
    },
  );

  server.app.get(
    "/stale-while-revalidate",
    useCacheControl({
      staleWhileRevalidate: 60,
    }),
    (context) => {
      context.text(StatusCode.OK, "Hello, World!");
    },
  );

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
