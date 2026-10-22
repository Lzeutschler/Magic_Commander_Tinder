"use client";

import { CURVE_LABELS } from "@/lib/cards/mana";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import { TEMPLATE_ROLES, TEMPLATE_ROLE_LABELS, type DeckTemplate } from "@/lib/deckbuilder/template";
import type { DeckStats } from "@/lib/decks/stats";
import { DECK_SIZE, type Deck } from "@/lib/decks/types";
import { cn } from "@/lib/utils";

export function RoleMeters({ stats, template }: { stats: DeckStats; template: DeckTemplate }) {
  return (
    <div className="space-y-2.5">
      {TEMPLATE_ROLES.map((role) => {
        const have = stats.roles[role];
        const target = template.roles[role];
        return (
          <div key={role} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{TEMPLATE_ROLE_LABELS[role]}</span>
              <span className={cn("tabular-nums", have >= target && "text-pick")}>
                {have}/{target}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn("h-full rounded-full transition-all duration-500", have >= target ? "bg-pick" : "bg-gold")}
                style={{ width: `${Math.min(100, (have / target) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MiniCurve({ stats, template }: { stats: DeckStats; template: DeckTemplate }) {
  const max = Math.max(...template.curve, ...stats.curve, 1);
  return (
    <div className="flex h-24 items-end gap-1.5">
      {stats.curve.map((count, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="relative flex h-16 w-full items-end">
            <div
              className="absolute inset-x-0 border-t border-dashed border-white/30"
              style={{ bottom: `${(template.curve[i] / max) * 100}%` }}
              title={`Target: ${template.curve[i]}`}
            />
            <div
              className={cn(
                "w-full rounded-t-sm transition-all duration-500",
                count > template.curve[i] ? "bg-pass/80" : "bg-gold/80",
              )}
              style={{ height: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{CURVE_LABELS[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function DeckCounter({ deck, stats, template }: { deck: Deck; stats: DeckStats; template: DeckTemplate }) {
  const rules = BRACKET_INFO[deck.bracket];
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-heading text-4xl font-bold tabular-nums">
            {stats.total}
            <span className="text-lg text-muted-foreground">/{DECK_SIZE}</span>
          </div>
          <div className="text-xs text-muted-foreground">cards picked</div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>
            Spells {stats.nonlands}/{DECK_SIZE - template.lands}
          </div>
          <div title="Basic lands fill the remaining slots when you finish">
            Lands {stats.lands}/{template.lands}
          </div>
          <div>
            Game Changers {stats.gameChangers}/{Number.isFinite(rules.maxGameChangers) ? rules.maxGameChangers : "∞"}
          </div>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold transition-all duration-500"
          style={{ width: `${(stats.total / DECK_SIZE) * 100}%` }}
        />
      </div>
    </div>
  );
}
