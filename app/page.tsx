import Link from "next/link";

import { DeckList } from "@/components/deck/deck-list";
import { ArrowRightIcon, ManaGlyph, type ManaGlyphName } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";

/** Each feature is drawn like a card: a name bar with its symbol, a rules box and a type line with the action. */
const FEATURES: { title: string; text: string; href: string; glyph: ManaGlyphName; action: string }[] = [
  {
    title: "Find your commander",
    text: "Answer seven questions about play style, colors and creatures — or just vibes — then swipe through commanders that fit you.",
    href: "/quiz",
    glyph: "planeswalker",
    action: "Take the quiz",
  },
  {
    title: "Deck Matchmaker",
    text: "Pick a commander and bracket, then swipe through cards. Curve, ramp, draw and removal stay balanced.",
    href: "/build",
    glyph: "creature",
    action: "Start a deck",
  },
  {
    title: "Goldfish",
    text: "Test your deck in an Arena-style sandbox: draw, play, tap and mulligan without the clunky UI.",
    href: "/goldfish",
    glyph: "tap",
    action: "Open the table",
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
          <h1 className="text-5xl leading-[0.95] font-extrabold sm:text-7xl">{SITE.tagline}</h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            A deckbuilding companion for Magic: The Gathering Commander. Choose a commander and a power level, then
            swipe right on the cards you love — we keep the deck playable while you have fun.
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
                "card-aspect -mx-6 w-44 shrink-0 rounded-[4.75%] border-[6px] border-ink bg-[#2a313d] p-1.5 shadow-xl lg:w-52",
                rotate,
              )}
            >
              <div className="flex h-full flex-col gap-1.5 rounded-[3%] bg-[#d9dde6] p-1.5 text-ink">
                <div className="h-4 rounded-xs bg-[#eef1f6] shadow-[inset_0_-1px_0_oklch(0_0_0/20%)]" />
                <div className={cn("grid flex-[1.1] place-items-center rounded-xs bg-gradient-to-b text-white/85", art)}>
                  <ManaGlyph name={glyph} className="text-5xl drop-shadow-[0_2px_0_oklch(0_0_0/40%)]" />
                </div>
                <div className="ui-label rounded-xs bg-[#eef1f6] px-1.5 py-0.5 text-[0.625rem] text-ink/80">
                  {label}
                </div>
                <div className="flex-1 space-y-1 rounded-xs bg-[#eef1f6] p-1.5">
                  <div className="h-1 w-11/12 rounded-full bg-ink/20" />
                  <div className="h-1 w-3/4 rounded-full bg-ink/20" />
                  <div className="h-1 w-5/6 rounded-full bg-ink/20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Features">
        {FEATURES.map(({ title, text, href, glyph, action }) => (
          <Link
            key={title}
            href={href}
            className="group flex flex-col gap-1.5 rounded-xl border-[5px] border-ink bg-secondary p-1.5 shadow-lg ring-1 ring-border transition hover:-translate-y-0.5 hover:ring-brand"
          >
            <span className="flex items-center justify-between gap-3 rounded-md bg-card px-3 py-2 shadow-sm">
              <span className="font-heading text-xl leading-tight font-bold">{title}</span>
              <ManaGlyph name={glyph} className="text-xl text-brand" />
            </span>
            <span className="flex-1 rounded-md bg-ink/60 px-3 py-3 text-sm leading-relaxed text-muted-foreground">{text}</span>
            <span className="ui-label flex items-center justify-between rounded-md bg-card px-3 py-2 text-foreground">
              {action}
              <span className="text-brand transition group-hover:translate-x-0.5" aria-hidden>
                ›
              </span>
            </span>
          </Link>
        ))}
      </section>

      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-3xl font-bold">Recent decks</h2>
          <Link href="/decks" className="ui-label text-muted-foreground hover:text-foreground">
            All decks
          </Link>
        </div>
        <DeckList limit={6} />
      </section>
    </div>
  );
}
