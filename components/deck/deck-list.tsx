"use client";

import Link from "next/link";

import { ColorIdentity } from "@/components/card/mana";
import { PlusIcon, UploadSimpleIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
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
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div className="panel-inset flex flex-col items-center gap-4 border-dashed p-10 text-center">
        <p className="text-muted-foreground">No decks yet. Build one by swiping, or import an existing list.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button nativeButton={false} render={<Link href="/build" />}>
            <PlusIcon /> Build a deck
          </Button>
          <ImportDialog>
            <Button variant="outline">
              <UploadSimpleIcon /> Import
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

/** A deck as a framed art crop with a name plate below, like a card's title and type line. */
function DeckTile({ deck, inProgress }: { deck: Deck; inProgress: boolean }) {
  const count = deckCount(deck.entries);
  const art = deck.commander.image ? cardImageUrl(deck.commander.image, "art_crop") : null;
  return (
    <Link
      href={inProgress ? `/build/${deck.id}` : `/decks/${deck.id}`}
      className="group panel flex flex-col overflow-hidden p-1.5 transition hover:-translate-y-0.5 hover:border-ember/70"
    >
      <div className="relative h-32 overflow-hidden rounded-md bg-muted">
        {art && (
          <div
            className="absolute inset-0 bg-cover bg-[center_25%] transition duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${art})` }}
          />
        )}
        {inProgress && <Badge className="absolute top-2 left-2">Swiping</Badge>}
      </div>
      <div className="space-y-1 px-2 pt-2.5 pb-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-xl leading-tight font-bold">{deck.name}</h3>
          <ColorIdentity colors={deck.commander.colorIdentity} />
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="tabular-nums">
            {count}/{DECK_SIZE}
          </span>{" "}
          cards · Bracket {deck.bracket} {BRACKET_INFO[deck.bracket].name}
        </p>
      </div>
    </Link>
  );
}
