"use client";

import { useState } from "react";

import { ShuffleIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { nameKey } from "@/lib/cards/names";
import { moveCard, shuffleLibrary } from "@/lib/goldfish/game";
import { ZONE_LABELS, type GameState, type ZoneId } from "@/lib/goldfish/types";

import { CardFace } from "./game-card";

const TARGETS: { zone: ZoneId; label: string; position?: "top" | "bottom" }[] = [
  { zone: "hand", label: "Hand" },
  { zone: "battlefield", label: "Battlefield" },
  { zone: "graveyard", label: "Graveyard" },
  { zone: "exile", label: "Exile" },
  { zone: "library", label: "Top", position: "top" },
  { zone: "library", label: "Bottom", position: "bottom" },
];

/**
 * Browse a whole zone and move cards out of it. For the library this is "search your library":
 * cards are listed by name so the order stays hidden, and the player shuffles afterwards.
 */
export function ZoneBrowser({
  zone,
  game,
  act,
  onClose,
}: {
  zone: ZoneId;
  game: GameState;
  act: (fn: (g: GameState) => GameState) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState("");
  const isLibrary = zone === "library";
  const query = nameKey(filter);

  const cards = game.zones[zone]
    .map((id) => game.cards[id])
    .filter((c) => !query || nameKey(`${c.card.name} ${c.card.typeLine}`).includes(query));
  if (isLibrary) cards.sort((a, b) => a.card.name.localeCompare(b.card.name));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {isLibrary ? "Search your library" : ZONE_LABELS[zone]} ({game.zones[zone].length})
          </DialogTitle>
          <DialogDescription>Hover a card and pick where it goes.</DialogDescription>
        </DialogHeader>
        <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by name or type…" autoFocus />
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-4 lg:grid-cols-6">
          {cards.map((card) => (
            <div key={card.instanceId} className="group relative">
              <CardFace card={{ ...card, faceDown: false }} />
              <div className="absolute inset-0 grid grid-cols-2 content-center gap-1 rounded-[4.75%] bg-ink/85 p-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                {TARGETS.filter((t) => t.zone !== zone || (isLibrary && t.position)).map((target) => (
                  <button
                    key={target.label}
                    type="button"
                    onClick={() => act((g) => moveCard(g, card.instanceId, target.zone, { position: target.position }))}
                    className="min-h-10 rounded-sm bg-secondary px-1 text-xs font-semibold shadow-sm hover:bg-primary hover:text-primary-foreground"
                  >
                    {target.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {cards.length === 0 && <p className="col-span-full py-8 text-center text-muted-foreground">No cards.</p>}
        </div>
        {isLibrary && (
          <div className="flex justify-end">
            <Button
              onClick={() => {
                act(shuffleLibrary);
                onClose();
              }}
            >
              <ShuffleIcon /> Shuffle and close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
