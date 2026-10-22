"use client";

import { useState } from "react";

import type { CommanderSummary } from "@/lib/cards/types";

import { CommanderPicker } from "./commander-picker";
import { CommanderSetup } from "./commander-setup";

export function BuildSetup() {
  const [commander, setCommander] = useState<CommanderSummary | null>(null);

  const selectCommander = (next: CommanderSummary) => {
    setCommander(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold sm:text-4xl">
          <span className="text-gold-gradient">Build a deck</span>
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Pick a commander and a power level. Then swipe through cards that fit — the deck keeps its mana curve and
          staples in balance while you choose.
        </p>
      </header>

      {commander && <CommanderSetup commander={commander} onClose={() => setCommander(null)} />}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{commander ? "Or choose another commander" : "Choose your commander"}</h2>
        <CommanderPicker selected={commander} onSelect={selectCommander} />
      </section>
    </div>
  );
}
