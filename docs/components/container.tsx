import type { ComponentChildren } from "preact";

export const Container = ({ children }: { children: ComponentChildren }) => {
  return <div className="max-w-4xl mx-auto px-4">{children}</div>;
};
