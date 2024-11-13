import { MageApp } from "./mage/app.ts";
import {
  handleErrors,
  minifyJson,
  setSecureHeaders,
} from "./mage/middlewares.ts";

const app = new MageApp();

app.use(handleErrors());
app.use(setSecureHeaders());
app.use(minifyJson());

app.get("/", (context, next) => {
  context.text("Hello, World!");

  return next();
});

app.get("/json", (context, next) => {
  context.json({ message: "Hello, World!" });

  return next();
});

app.run({
  port: 8000,
});
