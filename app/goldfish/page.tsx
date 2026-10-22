import type { Metadata } from "next";

import { GoldfishDeckPicker } from "@/components/goldfish/deck-picker";

export const metadata: Metadata = { title: "Goldfish" };

export default function GoldfishIndexPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">
          <span className="text-gold-gradient">Goldfish</span>
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Test a deck on an empty table: draw, mulligan, play lands and spells, tap, add counters and tokens. Pick a
          deck to start.
        </p>
      </header>
      <GoldfishDeckPicker />
    </div>
  );
}
