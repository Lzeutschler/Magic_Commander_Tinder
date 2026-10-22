import type { Metadata } from "next";
import { Suspense } from "react";

import { SwipeScreen } from "@/components/swipe/swipe-screen";

export const metadata: Metadata = { title: "Swipe" };

export default function SwipePage({ params }: PageProps<"/build/[deckId]">) {
  return (
    <Suspense>
      {params.then(({ deckId }) => (
        <SwipeScreen deckId={deckId} />
      ))}
    </Suspense>
  );
}
