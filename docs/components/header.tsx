import type { ComponentChildren } from "preact";
import { Container } from "./container.tsx";
import { ToggleTheme } from "./toggle-theme.tsx";

interface LinkProps {
  href: string;
  children: string;
}

const Link = (props: LinkProps) => {
  return (
    <a href={props.href} className="block hover:underline">
      {props.children}
    </a>
  );
};

interface NavItemProps {
  children: ComponentChildren;
}

const NavListItem = (props: NavItemProps) => {
  return <li className="py-4">{props.children}</li>;
};

export const Header = () => {
  return (
    <header>
      <Container>
        <nav className="flex justify-between items-center">
          <ul>
            <NavListItem>
              <Link href="/">🧙‍♂️ Mage</Link>
            </NavListItem>
          </ul>
          <ul className="flex items-center gap-4">
            <NavListItem>
              <Link href="/installation">Installation</Link>
            </NavListItem>
            <NavListItem>
              <Link href="https://github.com/deno-mage/app">GitHub</Link>
            </NavListItem>
            <NavListItem>
              <Link href="https://jsr.io/@mage/app">JSR</Link>
            </NavListItem>
            <NavListItem>
              <ToggleTheme />
            </NavListItem>
          </ul>
        </nav>
      </Container>
    </header>
  );
};
