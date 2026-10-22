import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-5 px-4 py-20 text-center">
      <p className="font-heading text-6xl font-bold text-gold-gradient" aria-hidden>
        404
      </p>
      <h1 className="text-2xl font-bold">This card isn&apos;t in the library</h1>
      <p className="text-muted-foreground">
        The page you were looking for doesn&apos;t exist or has been exiled. Decks only live in the browser they were
        built in, so a deck link from another device won&apos;t open here.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button nativeButton={false} render={<Link href="/" />}>
          Back to the start <ArrowRight aria-hidden />
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/decks" />}>
          My decks
        </Button>
      </div>
    </div>
  );
}
