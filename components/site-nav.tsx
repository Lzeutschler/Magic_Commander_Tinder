"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/build", label: "Build" },
  { href: "/decks", label: "My Decks" },
  { href: "/goldfish", label: "Goldfish", soon: true },
  { href: "/quiz", label: "Quiz", soon: true },
];

export function ActiveNav() {
  return <Nav pathname={usePathname()} />;
}

export function Nav({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      {NAV.map((item) =>
        item.soon ? (
          <span
            key={item.href}
            className="hidden cursor-default px-3 py-1.5 text-muted-foreground/50 sm:inline"
            title="Coming soon"
          >
            {item.label}
          </span>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-2 py-1.5 whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground sm:px-3",
              pathname?.startsWith(item.href) && "bg-white/5 text-foreground",
            )}
          >
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}
