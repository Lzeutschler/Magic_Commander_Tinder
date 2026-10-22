import type { Metadata } from "next";
import Link from "next/link";

import { CardBack } from "@/components/card/card-back";
import { ArrowRightIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 px-4 py-20 text-center">
      <div className="relative mb-2 flex items-center justify-center" aria-hidden>
        <CardBack className="w-24 -rotate-12 opacity-60" />
        <CardBack className="-ml-12 w-28 rotate-6" />
        <span className="numeral absolute -bottom-4 rounded-sm bg-ember px-2 py-1 text-3xl text-ink shadow-md">404</span>
      </div>
      <h1 className="text-4xl leading-tight font-extrabold">This card isn&apos;t in the library</h1>
      <p className="text-muted-foreground">
        The page you were looking for doesn&apos;t exist or has been exiled. Decks only live in the browser they were
        built in, so a deck link from another device won&apos;t open here.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button nativeButton={false} render={<Link href="/" />}>
          Back to the start <ArrowRightIcon aria-hidden />
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/decks" />}>
          My decks
        </Button>
      </div>
    </div>
  );
}
