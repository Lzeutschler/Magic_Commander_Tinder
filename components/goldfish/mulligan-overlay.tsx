"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { bottomCards, cardsToBottom, keepHand, mulligan } from "@/lib/goldfish/game";
import type { GameState } from "@/lib/goldfish/types";
import { cn } from "@/lib/utils";

import { CardFace } from "./game-card";

/** Opening hand decision: keep or London mulligan, then pick cards for the bottom. */
export function MulliganOverlay({ game, act }: { game: GameState; act: (fn: (g: GameState) => GameState) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const toBottom = cardsToBottom(game);
  const choosing = game.phase === "bottom";
  const hand = game.zones.hand.map((id) => game.cards[id]);

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : current.length < toBottom ? [...current, id] : current,
    );

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black/70 p-6 backdrop-blur-sm">
      <div className="text-center">
        <h2 className="text-3xl font-bold">
          <span className="text-gold-gradient">{choosing ? `Put ${toBottom} on the bottom` : "Opening hand"}</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          {choosing
            ? `Choose ${toBottom} card${toBottom > 1 ? "s" : ""} to put on the bottom of your library.`
            : game.mulligans === 0
              ? "Your first mulligan is free."
              : `Mulligans: ${game.mulligans}. Keeping now puts ${toBottom} card${toBottom === 1 ? "" : "s"} on the bottom.`}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 [--card-w:clamp(90px,11vw,170px)]">
        {hand.map((card) => (
          <button
            key={card.instanceId}
            type="button"
            disabled={!choosing}
            onClick={() => toggle(card.instanceId)}
            className={cn(
              "w-[var(--card-w)] rounded-[5%] transition",
              choosing && "hover:-translate-y-1",
              selected.includes(card.instanceId) && "translate-y-3 opacity-50 ring-2 ring-pass",
            )}
            data-card-name={card.card.name}
          >
            <CardFace card={card} />
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        {choosing ? (
          <Button
            size="lg"
            disabled={selected.length !== toBottom}
            onClick={() => {
              act((g) => bottomCards(g, selected));
              setSelected([]);
            }}
          >
            Confirm ({selected.length}/{toBottom})
          </Button>
        ) : (
          <>
            <Button size="lg" variant="outline" onClick={() => act(mulligan)} disabled={game.mulligans >= 6}>
              Mulligan <kbd className="ml-1 text-xs opacity-60">M</kbd>
            </Button>
            <Button size="lg" onClick={() => act(keepHand)}>
              Keep {hand.length}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
