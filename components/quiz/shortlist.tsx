"use client";

import { ArrowLeft, Loader2, Sparkles, Star, X } from "lucide-react";
import { useState } from "react";

import { CommanderSetup } from "@/components/build/commander-setup";
import { CardImage } from "@/components/card/card-image";
import { Button } from "@/components/ui/button";
import type { ScoredCommander, Track } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";
import { useQuizStore } from "@/stores/quiz";

import { matchPercent, useQuizRanking } from "./use-quiz-ranking";

export function Shortlist({ track }: { track: Track }) {
  const { byId, topScore, isLoading } = useQuizRanking(track);
  const decisions = useQuizStore((s) => s.decisions);
  const keepSwiping = useQuizStore((s) => s.keepSwiping);
  const remove = useQuizStore((s) => s.removeFromShortlist);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const entries = [...decisions.filter((d) => d.decision === "pick"), ...decisions.filter((d) => d.decision === "maybe")]
    .map((d) => ({ decision: d.decision, scored: byId.get(d.commanderId) }))
    .filter((e): e is { decision: typeof e.decision; scored: ScoredCommander } => Boolean(e.scored));
  const selected = entries.find((e) => e.scored.commander.id === selectedId)?.scored ?? entries[0]?.scored ?? null;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold sm:text-4xl">
            <span className="text-gold-gradient">Your shortlist</span>
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Choose your commander, set a power level and start swiping cards for its 99.
          </p>
        </div>
        <Button variant="outline" onClick={keepSwiping}>
          <ArrowLeft /> Keep swiping
        </Button>
      </header>

      {selected ? (
        <CommanderSetup
          key={selected.commander.id}
          commander={selected.commander}
          onClose={() => remove(selected.commander.id)}
          closeLabel="Remove from shortlist"
        >
          <ul className="space-y-1.5 text-sm">
            <li className="text-xs font-semibold tracking-widest text-gold uppercase">
              {matchPercent(selected.score, topScore)}% match
            </li>
            {selected.reasons.map((reason) => (
              <li key={reason.text} className="flex gap-2">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-gold" />
                {reason.text}
              </li>
            ))}
          </ul>
        </CommanderSetup>
      ) : (
        <div className="panel flex flex-col items-center gap-4 p-10 text-center text-muted-foreground">
          Your shortlist is empty. Swipe right on commanders you like.
          <Button onClick={keepSwiping}>Back to swiping</Button>
        </div>
      )}

      {entries.length > 1 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Or choose another</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {entries.map(({ decision, scored }) => {
              const { commander } = scored;
              const active = commander.id === selected?.commander.id;
              return (
                <div key={commander.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(commander.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    aria-pressed={active}
                    aria-label={commander.name}
                    className={cn(
                      "block w-full rounded-[5%] ring-2 ring-transparent transition hover:-translate-y-1",
                      active && "ring-gold",
                    )}
                  >
                    <CardImage card={commander} size="normal" />
                  </button>
                  <div className="mt-1.5 flex items-center justify-between gap-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {decision === "maybe" && <Star className="size-3 text-maybe" />}
                      {matchPercent(scored.score, topScore)}% match
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(commander.id)}
                      className="rounded p-0.5 hover:bg-white/10 hover:text-foreground"
                      aria-label={`Remove ${commander.name} from shortlist`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
