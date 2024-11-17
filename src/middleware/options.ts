import { MageMiddleware } from "../router.ts";
import { HttpMethod } from "../http.ts";

export const useOptions = (): MageMiddleware => {
  return (context) => {
    if (
      context.request.method === HttpMethod.Options &&
      context.matchedPathname
    ) {
      context.empty();

      context.response.headers.set(
        "Allow",
        context.getAvailableMethods(context.matchedPathname).join(", ")
      );
    }
  };
};
