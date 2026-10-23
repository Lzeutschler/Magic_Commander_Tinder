import type { Metadata } from "next";

import { GoldfishDeckPicker } from "@/components/goldfish/deck-picker";
import { PageHeader } from "@/components/page-header";
import { canonical } from "@/lib/metadata";

export const metadata: Metadata = { title: "Goldfish", ...canonical("/goldfish") };

export default function GoldfishIndexPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <PageHeader
        title="Goldfish"
        description="Test a deck on an empty table: draw, mulligan, play lands and spells, tap, add counters and tokens. Pick a deck to start."
      />
      <GoldfishDeckPicker />
    </div>
  );
}
