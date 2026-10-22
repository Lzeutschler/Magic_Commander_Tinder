"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/build", label: "Build" },
  { href: "/decks", label: "My Decks" },
  { href: "/goldfish", label: "Goldfish" },
  { href: "/quiz", label: "Quiz", soon: true },
];

export function ActiveNav() {
  return <Nav pathname={usePathname()} />;
}

export function Nav({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex h-full items-stretch gap-0.5 sm:gap-2">
      {NAV.map((item) =>
        item.soon ? (
          <span
            key={item.href}
            className="eyebrow hidden cursor-default items-center px-3 text-muted-foreground/60 sm:flex"
            title="Coming soon"
          >
            {item.label}
          </span>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname?.startsWith(item.href) ? "page" : undefined}
            className={cn(
              "eyebrow relative flex items-center px-2 text-[0.8125rem] whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground sm:px-3",
              "after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:bg-transparent sm:after:inset-x-3",
              pathname?.startsWith(item.href) && "text-foreground after:bg-ember",
            )}
          >
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}
