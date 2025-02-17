import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import { ensureDir } from "jsr:@std/fs";
import type { MageDevMiddleware } from "../../app/mod.ts";

/**
 * Options for building CSS file using PostCSS
 */
interface PostCSSOptions {
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
 * Build CSS file using PostCSS
 *
 * @param options PostCSS options
 */
export const buildPostCSS = async (options: PostCSSOptions) => {
  const input = await Deno.readTextFile(options.entry);
  const output = await postcss([tailwindcss()]).process(input, {
    from: options.entry,
    to: options.output,
  });

  const directory = options.output.split("/").slice(0, -1).join("/");
  await ensureDir(directory);

  await Deno.writeTextFile(options.output, output.css);
};

/**
 * Options for using Tailwind CSS
 */
interface UseTailwindOptions {
  /**
   * Tailwind config file
   *
   * @default "tailwind.config.ts"
   */
  configFilepath?: string;
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
 * Compile CSS file using PostCSS.
 *
 * @param options PoostCSS options
 * @returns MageDevMiddleware
 */
export const useTailwindCSS = (
  options: UseTailwindOptions,
): MageDevMiddleware => {
  return async (mode) => {
    if (mode === "build") {
      await buildPostCSS(options);
      return;
    }

    if (mode === "dev") {
      const watcher = Deno.watchFs("./", { recursive: true });

      for await (const event of watcher) {
        if (!event.paths.some((path) => path.endsWith(options.output))) {
          if (event.kind === "modify") {
            await buildPostCSS(options);
          }
        }
      }
    }
  };
};
