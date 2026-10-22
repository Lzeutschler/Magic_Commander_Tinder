"use client";

import { Plus, Upload } from "lucide-react";
import Link from "next/link";

import { ColorIdentity } from "@/components/card/mana";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cardImageUrl } from "@/lib/cards/image";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import { deckCount } from "@/lib/decks/stats";
import { DECK_SIZE, type Deck } from "@/lib/decks/types";
import { useDeckStore, useDecksHydrated } from "@/stores/decks";

import { ImportDialog } from "./import-dialog";

export function DeckList({ limit }: { limit?: number }) {
  const hydrated = useDecksHydrated();
  const decks = useDeckStore((s) => s.decks);
  const sessions = useDeckStore((s) => s.sessions);
  const sorted = Object.values(decks).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);

  if (!hydrated) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div className="panel flex flex-col items-center gap-4 p-10 text-center">
        <p className="text-muted-foreground">No decks yet. Build one by swiping, or import an existing list.</p>
        <div className="flex gap-2">
          <Button nativeButton={false} render={<Link href="/build" />}>
            <Plus /> Build a deck
          </Button>
          <ImportDialog>
            <Button variant="outline">
              <Upload /> Import
            </Button>
          </ImportDialog>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((deck) => (
        <DeckTile key={deck.id} deck={deck} inProgress={Boolean(sessions[deck.id])} />
      ))}
    </div>
  );
}

function DeckTile({ deck, inProgress }: { deck: Deck; inProgress: boolean }) {
  const count = deckCount(deck.entries);
  const art = deck.commander.image ? cardImageUrl(deck.commander.image, "art_crop") : null;
  return (
    <Link
      href={inProgress ? `/build/${deck.id}` : `/decks/${deck.id}`}
      className="group relative flex h-40 flex-col justify-end overflow-hidden rounded-2xl border border-white/10 p-4 shadow-xl transition hover:-translate-y-1 hover:border-gold/50"
    >
      {art && (
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${art})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/10" />
      <div className="relative space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-heading text-lg font-bold">{deck.name}</h3>
          <ColorIdentity colors={deck.commander.colorIdentity} />
        </div>
        <p className="text-xs text-muted-foreground">
          {count}/{DECK_SIZE} cards · Bracket {deck.bracket} {BRACKET_INFO[deck.bracket].name}
          {inProgress && <span className="ml-2 rounded bg-gold/20 px-1.5 py-0.5 text-gold">swiping</span>}
        </p>
      </div>
    </Link>
  );
}
