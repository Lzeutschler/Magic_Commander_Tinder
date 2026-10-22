"use client";

import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import { BRACKETS, type Bracket } from "@/lib/edhrec/types";
import { cn } from "@/lib/utils";

export function BracketPicker({
  value,
  onChange,
  deckCounts,
}: {
  value: Bracket;
  onChange: (bracket: Bracket) => void;
  deckCounts?: Partial<Record<Bracket, number>>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Bracket">
      {BRACKETS.map((bracket) => {
        const info = BRACKET_INFO[bracket];
        const active = value === bracket;
        return (
          <button
            key={bracket}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(bracket)}
            className={cn(
              "flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-white/25",
              active && "border-gold/80 bg-gold/10 shadow-[0_0_24px] shadow-gold/15",
            )}
          >
            <span className="flex items-baseline gap-2">
              <span className={cn("font-heading text-2xl font-bold", active ? "text-gold" : "text-muted-foreground")}>{bracket}</span>
              <span className="font-semibold">{info.name}</span>
            </span>
            <span className="text-xs text-muted-foreground">{info.tagline}</span>
            {deckCounts?.[bracket] !== undefined && (
              <span className="text-[11px] text-muted-foreground/70">{deckCounts[bracket]!.toLocaleString()} decks on EDHREC</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
