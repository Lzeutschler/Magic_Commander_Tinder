"use client";

import { ArrowRight, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CardImage } from "@/components/card/card-image";
import { ColorIdentity } from "@/components/card/mana";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { identityName } from "@/lib/cards/colors";
import type { CommanderSummary } from "@/lib/cards/types";
import { useCommanderInsights } from "@/lib/data/client";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import type { Bracket } from "@/lib/edhrec/types";
import { THEMES } from "@/lib/tagging/themes";
import { cn } from "@/lib/utils";
import { useDeckStore } from "@/stores/decks";

import { BracketPicker } from "./bracket-picker";

const MAX_THEMES = 12;
const THEME_LABELS = new Map(THEMES.map((t) => [t.id, t.label]));

/**
 * The chosen commander with bracket and EDHREC theme pickers. Starting creates the deck and opens
 * the deckbuilding swipe. `children` render below the commander's name, e.g. why it was suggested.
 */
export function CommanderSetup({
  commander,
  onClose,
  onStart,
  closeLabel = "Choose another commander",
  children,
}: {
  commander: CommanderSummary;
  onClose: () => void;
  closeLabel?: string;
  /** Called with the new deck's id right before navigating to it. */
  onStart?: (deckId: string) => void;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const createDeck = useDeckStore((s) => s.createDeck);
  const [bracket, setBracket] = useState<Bracket>(2);
  // The theme belongs to one commander; choosing another commander resets it.
  const [themeChoice, setThemeChoice] = useState<{ commanderId: string; slug: string | null } | null>(null);
  const theme = themeChoice?.commanderId === commander.id ? themeChoice.slug : null;
  const setTheme = (slug: string | null) => setThemeChoice({ commanderId: commander.id, slug });
  const [starting, setStarting] = useState(false);
  const insights = useCommanderInsights(commander.name);

  const start = () => {
    if (!insights.data) return;
    setStarting(true);
    const id = createDeck({ commander: insights.data.commander, bracket, theme });
    onStart?.(id);
    router.push(`/build/${id}`);
  };

  return (
    <section className="panel grid gap-6 p-5 md:grid-cols-[220px_1fr]">
      <div className="mx-auto w-48 md:w-full">
        <CardImage card={commander} flippable eager />
      </div>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{commander.name}</h2>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <ColorIdentity colors={commander.colorIdentity} />
              {identityName(commander.colorIdentity)} · {commander.typeLine}
            </p>
            {insights.data && insights.data.deckCount > 0 && (
              <p className="text-xs text-muted-foreground">{insights.data.deckCount.toLocaleString()} decks on EDHREC</p>
            )}
            {commander.partner && (
              <p className="text-xs text-amber-300/80">Partner and background pairings are coming later — you can build it solo for now.</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={closeLabel}>
            <X />
          </Button>
        </div>
        {children}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">Bracket</h3>
          <BracketPicker value={bracket} onChange={setBracket} deckCounts={insights.data?.bracketCounts} />
          <p className="text-sm text-muted-foreground">{BRACKET_INFO[bracket].description}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">Theme (optional)</h3>
          {insights.isLoading ? (
            <div className="flex gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-7 w-24 rounded-full" />
              ))}
            </div>
          ) : insights.data?.themes.length ? (
            <div className="flex flex-wrap gap-2">
              <ThemeChip active={theme === null} onClick={() => setTheme(null)}>
                Anything goes
              </ThemeChip>
              {insights.data.themes.slice(0, MAX_THEMES).map((t) => (
                <ThemeChip key={t.slug} active={theme === t.slug} onClick={() => setTheme(t.slug)}>
                  {t.label}
                  <span className="text-[10px] opacity-60">{t.deckCount.toLocaleString()}</span>
                </ThemeChip>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {commander.themes.map((t) => (
                <Badge key={t} variant="secondary">
                  {THEME_LABELS.get(t) ?? t}
                </Badge>
              ))}
              <span className="text-sm text-muted-foreground">No EDHREC themes for this commander yet.</span>
            </div>
          )}
        </div>

        <Button size="lg" className="h-11 px-6 text-base" onClick={start} disabled={!insights.data || starting}>
          {starting || insights.isLoading ? <Loader2 className="animate-spin" /> : null}
          Start swiping
          <ArrowRight />
        </Button>
        {insights.error && <p className="text-sm text-destructive">{insights.error.message}</p>}
      </div>
    </section>
  );
}

function ThemeChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-sm transition hover:border-white/30",
        active && "border-gold bg-gold/15 text-gold",
      )}
    >
      {children}
    </button>
  );
}
