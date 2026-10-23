"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { CardImage } from "@/components/card/card-image";
import { MagnifyingGlassIcon, XIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { nameKey } from "@/lib/cards/names";
import { canPair, pairingLabel, secondCommanderLabel } from "@/lib/cards/pairing";
import type { CommanderSummary } from "@/lib/cards/types";
import { useCommanders } from "@/lib/data/client";
import type { PairingStat } from "@/lib/recs/types";
import { cn } from "@/lib/utils";

/** Suggestions shown before searching. */
const SHOWN = 8;

/**
 * Picks the optional second commander: a partner, a Background, the Doctor or a companion. Pairings
 * that EDHREC decks play come first, with their deck counts; the rest follow by popularity.
 */
export function PartnerPicker({
  commander,
  partner,
  pairings,
  loading,
  onChange,
}: {
  commander: CommanderSummary;
  partner: CommanderSummary | null;
  pairings: PairingStat[];
  loading: boolean;
  onChange: (partner: CommanderSummary | null) => void;
}) {
  const commanders = useCommanders();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const label = secondCommanderLabel(commander);

  const options = useMemo(() => {
    const decks = new Map(pairings.map((p) => [nameKey(p.name), p.deckCount]));
    return (commanders.data ?? [])
      .filter((c) => canPair(commander, c))
      .map((c) => ({ commander: c, deckCount: decks.get(nameKey(c.name)) ?? null }))
      .sort((a, b) => (b.deckCount ?? -1) - (a.deckCount ?? -1) || (a.commander.edhrecRank ?? Infinity) - (b.commander.edhrecRank ?? Infinity));
  }, [commanders.data, commander, pairings]);

  const shown = useMemo(() => {
    const key = nameKey(deferredQuery.trim());
    return key ? options.filter((o) => nameKey(o.commander.name).includes(key)) : options.slice(0, SHOWN);
  }, [options, deferredQuery]);

  if (!commanders.isLoading && !options.length) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="ui-label text-muted-foreground">{label} (optional)</h3>
        <p className="text-sm text-muted-foreground">{intro(commander, label)} It adds its colors, and the deck holds 98 cards.</p>
      </div>

      {partner && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-brand bg-brand/12 px-3 py-2">
          <span className="text-sm">
            <span className="text-muted-foreground">With </span>
            <span className="font-semibold">{partner.name}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            <XIcon /> Build solo
          </Button>
        </div>
      )}

      {options.length > SHOWN && (
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search all ${options.length} ${label === "Background" ? "Backgrounds" : "options"}…`}
            aria-label={`Search ${label.toLowerCase()} options`}
            className="h-10 pl-9"
          />
        </div>
      )}

      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pt-1 pb-2" data-testid="partner-options">
        {(commanders.isLoading || loading) && !shown.length
          ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="card-aspect w-28 shrink-0 rounded-[4.75%]" />)
          : shown.map(({ commander: option, deckCount }) => {
              const active = partner?.id === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange(active ? null : option)}
                  aria-pressed={active}
                  title={option.name}
                  className="w-28 shrink-0 snap-start space-y-1.5 rounded-[5%] text-left transition duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <CardImage
                    card={option}
                    size="normal"
                    className={cn(active && "ring-3 ring-brand ring-offset-2 ring-offset-card")}
                  />
                  <span className="block truncate text-xs text-muted-foreground tabular-nums">
                    {deckCount ? `${deckCount.toLocaleString("en-US")} decks` : option.name}
                  </span>
                </button>
              );
            })}
        {!commanders.isLoading && !shown.length && <p className="py-6 text-sm text-muted-foreground">Nothing matches “{query}”.</p>}
      </div>
    </div>
  );
}

function intro(commander: CommanderSummary, label: string): string {
  switch (label) {
    case "Background":
      return "Choose a Background as a second commander.";
    case "Doctor":
      return "Doctor's companion: team up with a Doctor as a second commander.";
    case "Companion":
      return "Every Doctor can bring a companion as a second commander.";
    default:
      return `${pairingLabel(commander)}: add a second commander.`;
  }
}
