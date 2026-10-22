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
              "flex min-h-10 flex-col gap-1 rounded-lg border border-border bg-card p-3 text-left shadow-sm transition hover:border-input hover:bg-accent",
              active && "border-ember bg-ember/12 shadow-[inset_0_0_0_1px_var(--ember),0_2px_0_0_oklch(0_0_0/45%)] hover:border-ember hover:bg-ember/12",
            )}
          >
            <span className="flex items-baseline gap-2">
              <span className={cn("numeral text-3xl", active ? "text-ember" : "text-muted-foreground")}>{bracket}</span>
              <span className="font-semibold leading-tight">{info.name}</span>
            </span>
            <span className="text-xs text-muted-foreground">{info.tagline}</span>
            {deckCounts?.[bracket] !== undefined && (
              <span className="text-[11px] text-muted-foreground tabular-nums">{deckCounts[bracket]!.toLocaleString()} decks on EDHREC</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
