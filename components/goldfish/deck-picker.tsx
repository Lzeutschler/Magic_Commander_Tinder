"use client";

import { Play, Upload } from "lucide-react";
import Link from "next/link";

import { ColorIdentity } from "@/components/card/mana";
import { ImportDialog } from "@/components/deck/import-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cardImageUrl } from "@/lib/cards/image";
import { deckCount } from "@/lib/decks/stats";
import { DECK_SIZE } from "@/lib/decks/types";
import { useDeckStore, useDecksHydrated } from "@/stores/decks";

export function GoldfishDeckPicker() {
  const hydrated = useDecksHydrated();
  const decks = Object.values(useDeckStore((s) => s.decks)).sort((a, b) => b.updatedAt - a.updatedAt);

  if (!hydrated) return <Skeleton className="h-40 rounded-2xl" />;

  return (
    <div className="space-y-4">
      {decks.length === 0 && (
        <p className="panel p-6 text-center text-muted-foreground">
          No decks yet. <Link href="/build" className="text-gold underline">Build one</Link> or import a list.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck) => {
          const count = deckCount(deck.entries);
          const art = deck.commander.image ? cardImageUrl(deck.commander.image, "art_crop") : null;
          return (
            <Link
              key={deck.id}
              href={`/goldfish/${deck.id}`}
              className="group panel flex items-center gap-3 overflow-hidden p-3 transition hover:-translate-y-0.5 hover:border-gold/50"
            >
              <div
                className="size-16 shrink-0 rounded-lg bg-muted bg-cover bg-center"
                style={art ? { backgroundImage: `url(${art})` } : undefined}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-heading font-bold">{deck.name}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ColorIdentity colors={deck.commander.colorIdentity} />
                  <span className={count === DECK_SIZE ? undefined : "text-amber-300"}>
                    {count}/{DECK_SIZE} cards
                  </span>
                </div>
              </div>
              <Play className="size-5 text-gold opacity-60 transition group-hover:opacity-100" />
            </Link>
          );
        })}
      </div>
      <ImportDialog>
        <Button variant="outline">
          <Upload /> Import a deck list
        </Button>
      </ImportDialog>
    </div>
  );
}
