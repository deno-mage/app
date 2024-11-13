# Mage

## Ideation

Context passes through with utils for building responses, `ctx.render`, `ctx.text`, `ctx.json`

Examples:

```tsx
export const get = async (ctx: MageContext) => {
  return ctx.render(<div>Hello World</div>);
  );
};

export const get = async (ctx: MageContext) => {
  return ctx.text("Hello World");
};

export const post = async (ctx: MageContext) => {
  return ctx.json({ message: "Hello World" });
};

export const put = async (ctx: MageContext) => {
  return ctx.json({ message: "Hello World" });
};

export const del = async (ctx: MageContext) => {
  return ctx.json({ message: "Hello World" });
};

export const patch = async (ctx: MageContext) => {
  return ctx.json({ message: "Hello World" });
};
```

Code entry point over file system.

```tsx
import { MageApp } from "mage";
import * as home from "./routes/home.tsx";

const app = new MageApp();

app.get("/", home.get);

app.start({
  port: process.env.MAGE_PORT ?? 3000,
});
```
