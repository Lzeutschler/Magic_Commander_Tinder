import Link from "next/link";

import { DeckList } from "@/components/deck/deck-list";
import { ArrowRightIcon, ManaGlyph, type ManaGlyphName } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "Find your commander",
    text: "Answer a few questions about colors, creatures and play style and get commanders that fit you.",
    href: null,
  },
  {
    title: "Deckbuilding Tinder",
    text: "Pick a commander and bracket, then swipe through cards. Curve, ramp, draw and removal stay balanced.",
    href: "/build",
  },
  {
    title: "Goldfish",
    text: "Test your deck in an Arena-style sandbox: draw, play, tap and mulligan without the clunky UI.",
    href: "/goldfish",
  },
];

/** Three fanned placeholder cards, one per card type, drawn in the app's own frame. */
const FAN: { glyph: ManaGlyphName; label: string; art: string; rotate: string }[] = [
  { glyph: "land", label: "Land", art: "from-[oklch(0.55_0.1_150)] to-[oklch(0.32_0.06_160)]", rotate: "-rotate-12 translate-x-10 translate-y-6" },
  { glyph: "instant", label: "Instant", art: "from-[oklch(0.6_0.11_240)] to-[oklch(0.33_0.07_255)]", rotate: "rotate-0 z-10" },
  { glyph: "creature", label: "Creature", art: "from-[oklch(0.66_0.16_40)] to-[oklch(0.38_0.1_30)]", rotate: "rotate-12 -translate-x-10 translate-y-6" },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-16 px-4 py-12 sm:py-16">
      <section className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <p className="eyebrow text-ember">For Magic: The Gathering Commander</p>
          <h1 className="text-5xl leading-[0.95] font-extrabold sm:text-7xl">
            Swipe your way to a <span className="text-ember italic">Commander</span> deck
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Choose a commander, choose a power level, and swipe right on the cards you love. We keep the deck playable
            while you have fun.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" nativeButton={false} render={<Link href="/build" />}>
              Start building <ArrowRightIcon />
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/decks" />}>
              My decks
            </Button>
          </div>
        </div>
        <div className="hidden justify-center py-6 md:flex" aria-hidden="true">
          {FAN.map(({ glyph, label, art, rotate }) => (
            <div
              key={glyph}
              className={cn(
                "card-aspect -mx-6 w-44 shrink-0 rounded-[4.75%] border-[6px] border-ink bg-[oklch(0.28_0.015_60)] p-1.5 shadow-xl lg:w-52",
                rotate,
              )}
            >
              <div className="flex h-full flex-col gap-1.5 rounded-[3%] bg-[oklch(0.86_0.03_85)] p-1.5 text-ink">
                <div className="h-4 rounded-xs bg-[oklch(0.94_0.02_85)] shadow-[inset_0_-1px_0_oklch(0_0_0/20%)]" />
                <div className={cn("grid flex-[1.1] place-items-center rounded-xs bg-gradient-to-b text-white/85", art)}>
                  <ManaGlyph name={glyph} className="text-5xl drop-shadow-[0_2px_0_oklch(0_0_0/40%)]" />
                </div>
                <div className="eyebrow rounded-xs bg-[oklch(0.94_0.02_85)] px-1.5 py-0.5 text-[0.625rem] text-ink/80">
                  {label}
                </div>
                <div className="flex-1 space-y-1 rounded-xs bg-[oklch(0.94_0.02_85)] p-1.5">
                  <div className="h-1 w-11/12 rounded-full bg-ink/20" />
                  <div className="h-1 w-3/4 rounded-full bg-ink/20" />
                  <div className="h-1 w-5/6 rounded-full bg-ink/20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid border-y border-border md:grid-cols-3">
        {STEPS.map(({ title, text, href }, i) => {
          const content = (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <span className="numeral text-4xl text-ember">{String(i + 1).padStart(2, "0")}</span>
                {href ? (
                  <ArrowRightIcon className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-ember" />
                ) : (
                  <span className="eyebrow text-muted-foreground">Coming soon</span>
                )}
              </div>
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground">{text}</p>
            </>
          );
          const className = cn(
            "group flex flex-col gap-3 p-6 md:border-l md:first:border-l-0 max-md:border-t max-md:first:border-t-0",
            href ? "transition-colors hover:bg-card" : "opacity-75",
          );
          return href ? (
            <Link key={title} href={href} className={className}>
              {content}
            </Link>
          ) : (
            <div key={title} className={className}>
              {content}
            </div>
          );
        })}
      </section>

      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-3xl font-bold">Recent decks</h2>
          <Link href="/decks" className="eyebrow text-muted-foreground hover:text-foreground">
            All decks
          </Link>
        </div>
        <DeckList limit={6} />
      </section>
    </div>
  );
}
