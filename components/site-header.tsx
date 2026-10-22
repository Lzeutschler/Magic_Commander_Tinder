import { Flame } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ActiveNav, Nav } from "./site-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-heading text-base font-bold tracking-wider whitespace-nowrap sm:text-lg">
          <Flame className="size-5 text-gold" />
          <span className="text-gold-gradient">Commander Tinder</span>
        </Link>
        {/* The active link depends on the URL, which is only known at request time. */}
        <Suspense fallback={<Nav pathname={null} />}>
          <ActiveNav />
        </Suspense>
      </div>
    </header>
  );
}
