import type { LayoutProps } from "../../../mod.ts";

export function Layout(data: LayoutProps) {
  return <a href={`${data.basePath}/home`}>Home</a>;
}
