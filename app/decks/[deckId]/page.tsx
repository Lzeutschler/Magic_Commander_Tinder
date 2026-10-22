import type { Metadata } from "next";
import { Suspense } from "react";

import { DeckEditor } from "@/components/deck/deck-editor";

export const metadata: Metadata = { title: "Deck" };

export default function DeckPage({ params }: PageProps<"/decks/[deckId]">) {
  return (
    <Suspense>
      {params.then(({ deckId }) => (
        <DeckEditor deckId={deckId} />
      ))}
    </Suspense>
  );
}
