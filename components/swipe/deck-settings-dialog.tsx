"use client";

import { DeckSettingsForm } from "@/components/build/deck-settings-form";
import { SlidersHorizontalIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { deckRecommendation } from "@/lib/deckbuilder/settings";
import type { Deck } from "@/lib/decks/types";
import { useDeckStore } from "@/stores/decks";

/** Swipe settings while swiping; every change applies to the next suggestion. */
export function DeckSettingsDialog({ deck, trigger }: { deck: Deck; trigger?: React.ReactElement }) {
  const updateSettings = useDeckStore((s) => s.updateSettings);
  const recommended = deckRecommendation(deck);

  return (
    <Dialog>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="outline">
              <SlidersHorizontalIcon /> Deck settings
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Deck settings</DialogTitle>
          <DialogDescription>Changes apply to the next card you see.</DialogDescription>
        </DialogHeader>
        <DeckSettingsForm
          settings={deck.settings}
          recommended={recommended}
          bracket={deck.bracket}
          onChange={(settings) => updateSettings(deck.id, settings)}
        />
      </DialogContent>
    </Dialog>
  );
}
