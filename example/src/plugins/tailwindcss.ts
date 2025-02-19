import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import { ensureDir } from "jsr:@std/fs";
import { relative, resolve } from "jsr:@std/path";
import { debounce } from "jsr:@std/async/debounce";
import type { MagePlugin } from "../../../app/mod.ts";
import { MageLogger } from "../../../logs/mod.ts";

/**
 * Options for using TailwindCSS plugin
 */
interface TailwindCSSPluginOptions {
  /**
   * Tailwind config file
   */
  configFilepath: string;
  /**
   * Path to the entry CSS file
   */
  entry: string;
  /**
   * Path to the output CSS file
   */
  output: string;
}

/**
 * Compile CSS using TailwindCSS
 */
class TailwindCSS implements MagePlugin {
  private _logger = new MageLogger(this.name);
  private _options: TailwindCSSPluginOptions;

  /**
   * Create a new TailwindCSS plugin
   *
   * @param options TailwindCSS plugin options
   */
  constructor(options: TailwindCSSPluginOptions) {
    this._options = {
      configFilepath: resolve(options.configFilepath),
      entry: resolve(options.entry),
      output: resolve(options.output),
    };
  }

  public get name() {
    return "TailwindCSSPlugin";
  }

  /**
   * Build the CSS file using PostCSS and TailwindCSS
   */
  public onBuild = async () => {
    await this.buildPostCSS();
  };

  /**
   * Watch for changes in the CSS file and other files and
   * rebuild it using PostCSS and TailwindCSS
   */
  public onDevelop = async () => {
    const watcher = Deno.watchFs("./", { recursive: true });
    const deboundedBuildPostCSS = debounce(() => this.buildPostCSS(), 100);

    for await (const event of watcher) {
      // Ensure we ignore the output file to prevent an infinite compilation loop
      if (!event.paths.some((path) => path === (this._options.output))) {
        if (event.kind === "modify") {
          deboundedBuildPostCSS();
        }
      }
    }
  };

  /**
   * Build CSS file using PostCSS
   *
   * @param options PostCSS options
   */
  private async buildPostCSS() {
    try {
      const input = await Deno.readTextFile(this._options.entry);
      const output = await postcss([tailwindcss()]).process(input, {
        from: this._options.entry,
        to: this._options.output,
      });

      const directory = this._options.output.split("/").slice(0, -1).join("/");
      await ensureDir(directory);

      await Deno.writeTextFile(this._options.output, output.css);
      this._logger.success(
        `Built ${relative(Deno.cwd(), this._options.output)}`,
      );
    } catch (error) {
      this._logger.error(error as Error);
    }
  }
}

export const tailwindCSS = (options: TailwindCSSPluginOptions) => {
  return new TailwindCSS(options);
};
