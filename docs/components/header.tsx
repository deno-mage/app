import type { ComponentChildren } from "preact";
import { ToggleTheme } from "./toggle-theme.tsx";
import { GithubIcon } from "./icons/github.tsx";
import { MageLogo } from "./icons/mage.tsx";

interface LinkProps {
  href: string;
  children: ComponentChildren;
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
    <header className="sticky top-0 z-50 bg-zinc-100  dark:bg-zinc-800 px-6 border-b border-b-zinc-300 dark:border-b-zinc-700 mb-6">
      <nav className="flex justify-between items-center">
        <ul>
          <NavListItem>
            <Link href="/">
              <div className="w-[135px] h-[62px]">
                <MageLogo />
              </div>
            </Link>
          </NavListItem>
        </ul>
        <ul className="flex items-center gap-6">
          <NavListItem>
            <Link href="/installation">Docs</Link>
          </NavListItem>
          <NavListItem>
            <Link href="https://github.com/deno-mage/app">
              <GithubIcon />
            </Link>
          </NavListItem>
          <NavListItem>
            <ToggleTheme />
          </NavListItem>
        </ul>
      </nav>
    </header>
  );
};
