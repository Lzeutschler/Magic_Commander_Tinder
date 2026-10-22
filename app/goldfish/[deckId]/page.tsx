import type { Metadata } from "next";
import { Suspense } from "react";

import { GoldfishScreen } from "@/components/goldfish/goldfish-screen";

export const metadata: Metadata = { title: "Goldfish" };

export default function GoldfishPage({ params }: PageProps<"/goldfish/[deckId]">) {
  return (
    <Suspense>
      {params.then(({ deckId }) => (
        <GoldfishScreen deckId={deckId} />
      ))}
    </Suspense>
  );
}
