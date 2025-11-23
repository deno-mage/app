import type { ComponentChildren } from "preact";
import { ToggleTheme } from "./toggle-theme.tsx";
import { GithubIcon } from "./icons/github.tsx";
import { MageLogo } from "./icons/mage.tsx";

interface LinkProps {
  href: string;
  children: ComponentChildren;
  target?: string;
  rel?: string;
  label?: string;
}

const Link = (props: LinkProps) => {
  return (
    <a
      href={props.href}
      className="block hover:underline"
      target={props.target}
      rel={props.rel}
      aria-label={props.label}
    >
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
    <header className="h-[94px] sticky top-0 z-50 bg-zinc-100  dark:bg-zinc-800 px-6 border-b border-b-zinc-300 dark:border-b-zinc-700">
      <nav className="flex justify-between items-center mx-auto max-w-[1280px]">
        <ul>
          <NavListItem>
            <Link href="/" label="Mage Documentation Home">
              <div className="w-[135px] h-[62px]">
                <MageLogo />
              </div>
            </Link>
          </NavListItem>
        </ul>
        <ul className="flex items-center gap-6">
          <NavListItem>
            <Link
              href="https://github.com/deno-mage/app"
              target="_blank"
              rel="noopener noreferrer"
              label="GitHub Repository"
            >
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
