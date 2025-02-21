import { beforeAll, describe, it } from "@std/testing/bdd";
import { assertSpyCall, spy } from "@std/testing/mock";
import { MageApp } from "../mod.ts";

const app = new MageApp();
const plugin = {
  name: "TestPlugin",
  onBuild: spy(),
  onDevelop: spy(),
};

beforeAll(() => {
  app.plugin(plugin);
});

describe("plugins", () => {
  it("should call onBuild", async () => {
    await app.build();

    assertSpyCall(plugin.onBuild, 0, { args: [app] });
  });

  it("should call onDevelop", async () => {
    await app.develop();

    assertSpyCall(plugin.onDevelop, 0, { args: [app] });
  });
});
