"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { resolveLook } from "@/lib/goldfish/game";
import type { GameState, LookResult } from "@/lib/goldfish/types";
import { cn } from "@/lib/utils";

import { CardFace } from "./game-card";

export type LookMode = "scry" | "surveil" | "reveal";

type Destination = "top" | "bottom" | "graveyard";

const MODES: Record<LookMode, { title: string; options: Destination[]; description: string }> = {
  scry: { title: "Scry", options: ["top", "bottom"], description: "Keep cards on top in the shown order, or put them on the bottom." },
  surveil: { title: "Surveil", options: ["top", "graveyard"], description: "Keep cards on top or put them into your graveyard." },
  reveal: { title: "Top of library", options: ["top", "bottom", "graveyard"], description: "Look at the top cards and rearrange them." },
};

export interface LookRequest {
  mode: LookMode;
  ids: string[];
}

/** Scry, surveil or look at the top X cards; nothing changes until the player confirms. */
export function LookDialog({
  request,
  game,
  act,
  onClose,
}: {
  request: LookRequest;
  game: GameState;
  act: (fn: (g: GameState) => GameState) => void;
  onClose: () => void;
}) {
  const mode = MODES[request.mode];
  const [order, setOrder] = useState(request.ids);
  const [destinations, setDestinations] = useState<Record<string, Destination>>(
    Object.fromEntries(request.ids.map((id) => [id, "top"])),
  );

  const shift = (index: number, delta: number) =>
    setOrder((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const confirm = () => {
    const result: LookResult = { top: [], bottom: [], graveyard: [] };
    for (const id of order) result[destinations[id]].push(id);
    act((g) => resolveLook(g, result, mode.title));
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {mode.title} {request.ids.length}
          </DialogTitle>
          <DialogDescription>{mode.description} Leftmost is the top card.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap justify-center gap-4 [--card-w:150px]">
          {order.map((id, index) => (
            <div key={id} className="flex w-[var(--card-w)] flex-col gap-2">
              <div className={cn("transition", destinations[id] !== "top" && "opacity-50")}>
                <CardFace card={game.cards[id]} />
              </div>
              <div className="flex justify-between">
                <Button size="icon-xs" variant="ghost" onClick={() => shift(index, -1)} disabled={index === 0} aria-label="Move left">
                  <ChevronLeft />
                </Button>
                <Button size="icon-xs" variant="ghost" onClick={() => shift(index, 1)} disabled={index === order.length - 1} aria-label="Move right">
                  <ChevronRight />
                </Button>
              </div>
              <div className="flex gap-1">
                {mode.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDestinations((d) => ({ ...d, [id]: option }))}
                    className={cn(
                      "flex-1 rounded-md border border-white/10 py-1 text-[11px] capitalize transition",
                      destinations[id] === option && "border-gold bg-gold/15 text-gold",
                    )}
                  >
                    {option === "graveyard" ? "Grave" : option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={confirm}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
