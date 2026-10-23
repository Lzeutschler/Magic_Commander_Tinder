"use client";

import { useMemo, useState } from "react";

import { PageHeader } from "@/components/page-header";
import type { CommanderSummary } from "@/lib/cards/types";
import { useCommanders } from "@/lib/data/client";

import { CommanderPicker } from "./commander-picker";
import { CommanderSetup } from "./commander-setup";

export function BuildSetup() {
  const commanders = useCommanders();
  // Undefined until the visitor picks or closes a commander; until then a /build?commander=… link
  // (from a shared quiz result) chooses one.
  const [chosen, setChosen] = useState<CommanderSummary | null | undefined>(undefined);
  const linked = useMemo(() => {
    const name = commanders.data && new URLSearchParams(window.location.search).get("commander");
    return name ? (commanders.data?.find((c) => c.name === name) ?? null) : null;
  }, [commanders.data]);
  const commander = chosen === undefined ? linked : chosen;

  const selectCommander = (next: CommanderSummary) => {
    setChosen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8">
      <PageHeader
        title="Build a deck"
        description="Pick a commander and a power level. Then swipe through cards that fit — the deck keeps its mana curve and staples in balance while you choose."
      />

      {commander && <CommanderSetup commander={commander} onClose={() => setChosen(null)} />}

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">{commander ? "Or choose another commander" : "Choose your commander"}</h2>
        <CommanderPicker selected={commander} onSelect={selectCommander} />
      </section>
    </div>
  );
}
