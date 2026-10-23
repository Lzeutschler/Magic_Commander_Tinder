import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BrewLoader } from "@/components/cauldron";
import { SharedDeckView } from "@/components/deck/shared-deck-view";
import { frontFaceName } from "@/lib/cards/names";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import { deckCount } from "@/lib/decks/stats";
import { OPEN_GRAPH } from "@/lib/metadata";
import { SITE } from "@/lib/site";
import { loadSharedDeck } from "@/lib/server/shared-deck";

export async function generateMetadata({ params }: PageProps<"/d/[code]">): Promise<Metadata> {
  const { code } = await params;
  const path = `/d/${code}`;
  const deck = await loadSharedDeck(code);
  if (!deck) return { title: "Shared deck", robots: { index: false } };

  const title = `${deck.name} · Bracket ${deck.bracket} Commander deck`;
  const description =
    `${frontFaceName(deck.commander.name)}, bracket ${deck.bracket} (${BRACKET_INFO[deck.bracket].name}), ` +
    `${deckCount(deck.entries) + 1} cards. Brewed with ${SITE.name}: see the list, goldfish it or keep a copy.`;
  return {
    title,
    description,
    // Every deck is its own URL; search engines should index the site, not each shared list.
    robots: { index: false },
    alternates: { canonical: path },
    // The deck image comes from opengraph-image.tsx next to this page.
    openGraph: { ...OPEN_GRAPH, title, description, url: path },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function SharedDeckPage({ params }: PageProps<"/d/[code]">) {
  return (
    <Suspense fallback={<BrewLoader className="flex-1 justify-center">Opening the brew…</BrewLoader>}>
      {params.then(({ code }) => (
        <SharedDeck code={code} />
      ))}
    </Suspense>
  );
}

async function SharedDeck({ code }: { code: string }) {
  const deck = await loadSharedDeck(code);
  if (!deck) notFound();
  return <SharedDeckView shared={deck} />;
}
