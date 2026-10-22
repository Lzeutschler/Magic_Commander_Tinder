import { ArrowRight, Heart, Sparkles, Swords } from "lucide-react";
import Link from "next/link";

import { DeckList } from "@/components/deck/deck-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    title: "Find your commander",
    text: "Answer a few questions about colors, creatures and play style and get commanders that fit you.",
    icon: Sparkles,
    href: null,
  },
  {
    title: "Deckbuilding Tinder",
    text: "Pick a commander and bracket, then swipe through cards. Curve, ramp, draw and removal stay balanced.",
    icon: Heart,
    href: "/build",
  },
  {
    title: "Goldfish",
    text: "Test your deck in an Arena-style sandbox: draw, play, tap and mulligan without the clunky UI.",
    icon: Swords,
    href: null,
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-16 px-4 py-12 sm:py-20">
      <section className="space-y-6 text-center">
        <h1 className="text-4xl font-bold sm:text-6xl">
          <span className="text-gold-gradient">Swipe your way to a Commander deck</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Choose a commander, choose a power level, and swipe right on the cards you love. We keep the deck playable
          while you have fun.
        </p>
        <div className="flex justify-center gap-3">
          <Button size="lg" className="h-11 px-6 text-base" nativeButton={false} render={<Link href="/build" />}>
            Start building <ArrowRight />
          </Button>
          <Button size="lg" variant="outline" className="h-11 px-6 text-base" nativeButton={false} render={<Link href="/decks" />}>
            My decks
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {FEATURES.map(({ title, text, icon: Icon, href }) => {
          const content = (
            <>
              <div className="flex items-center justify-between">
                <Icon className="size-7 text-gold" />
                {!href && <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">Coming soon</span>}
              </div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground">{text}</p>
            </>
          );
          const className = cn("panel flex flex-col gap-3 p-6", href && "transition hover:-translate-y-1 hover:border-gold/50");
          return href ? (
            <Link key={title} href={href} className={className}>
              {content}
            </Link>
          ) : (
            <div key={title} className={cn(className, "opacity-70")}>
              {content}
            </div>
          );
        })}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Recent decks</h2>
        <DeckList limit={6} />
      </section>
    </div>
  );
}
