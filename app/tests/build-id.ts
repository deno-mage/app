import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { MageApp } from "../mod.ts";

describe("build-id", () => {
  it("should return random guid by default", () => {
    const app = new MageApp();

    expect(app.buildId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("should set custom build id", () => {
    const app = new MageApp({ buildId: "custom-id" });

    expect(app.buildId).toBe("custom-id");
  });
});
