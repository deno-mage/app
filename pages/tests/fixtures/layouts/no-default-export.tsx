import type { LayoutProps } from "../../../types.ts";

export function InvalidLayout(props: LayoutProps) {
  return <div>{props.title}</div>;
}
