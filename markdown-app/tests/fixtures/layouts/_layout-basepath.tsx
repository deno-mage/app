import type { LayoutProps } from "../../../mod.ts";

export function Layout(props: LayoutProps) {
  return <a href={props.asset("home")}>Home</a>;
}
