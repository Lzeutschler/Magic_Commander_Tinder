"use client";

import { useMemo } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Deck } from "@/lib/decks/types";
import { simulateOpeningHands } from "@/lib/goldfish/simulate";
import { cn } from "@/lib/utils";

const ITERATIONS = 1000;

function percent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

export function StatsDialog({ deck, onClose }: { deck: Deck; onClose: () => void }) {
  const result = useMemo(() => simulateOpeningHands(deck, ITERATIONS), [deck]);
  const maxShare = Math.max(...result.landShares);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Opening hand simulator</DialogTitle>
          <DialogDescription>
            {ITERATIONS.toLocaleString()} shuffled games: a land each turn when possible, cheap ramp cast early.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="lands in opening hand" value={result.averageLands.toFixed(1)} />
          <Stat label="hands with 2–4 lands" value={percent(result.keepable)} />
          <Stat label="avg. turn commander is castable" value={result.averageCommanderTurn.toFixed(1)} />
        </div>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Lands in the opening 7</h3>
          <div className="flex h-32 items-end gap-2">
            {result.landShares.map((share, lands) => (
              <div key={lands} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{percent(share)}</span>
                <div
                  className={cn("w-full rounded-t-sm", lands >= 2 && lands <= 4 ? "bg-gold" : "bg-white/25")}
                  style={{ height: `${(share / maxShare) * 80}px` }}
                />
                <span className="text-xs">{lands}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">
            Commander castable by turn ({deck.commander.cmc} mana)
          </h3>
          <div className="grid grid-cols-10 gap-1 text-center text-[11px]">
            {result.commanderByTurn.map((share, i) => (
              <div key={i} className="space-y-1">
                <div className="relative h-16 overflow-hidden rounded bg-white/5">
                  <div className="absolute inset-x-0 bottom-0 bg-pick/70" style={{ height: `${share * 100}%` }} />
                </div>
                <div className="text-muted-foreground">T{i + 1}</div>
                <div>{percent(share)}</div>
              </div>
            ))}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-3">
      <div className="font-heading text-2xl font-bold text-gold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
