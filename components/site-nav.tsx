"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/build", label: "Build" },
  { href: "/decks", label: "My Decks" },
  { href: "/goldfish", label: "Goldfish" },
  { href: "/quiz", label: "Quiz" },
];

export function ActiveNav() {
  return <Nav pathname={usePathname()} />;
}

export function Nav({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      {NAV.map((item) => (
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
      ))}
    </nav>
  );
}
