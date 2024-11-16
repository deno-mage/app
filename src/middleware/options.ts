import { MageMiddleware } from "../router.ts";
import { HttpMethod, StatusCode } from "../http.ts";

interface OptionsConfig {
  methods: string[];
  pathname: string;
}

export const useOptions = (config: OptionsConfig[]): MageMiddleware => {
  return async (context, next) => {
    await next();

    if (context.request.method !== HttpMethod.Options || context.response) {
      // no need to handle options requests if not an
      // options request or has already been handled
      return;
    }

    context.headers.set(
      "Allow",
      config
        .filter((middleware) => middleware.pathname === context.url.pathname)
        .map((entry) => entry.methods?.join(", "))
        .join(", ")
    );

    context.text(StatusCode.OK, "");
  };
};
