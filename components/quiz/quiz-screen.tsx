"use client";

import { BrewLoader } from "@/components/cauldron";
import { useQuizHydrated, useQuizStore } from "@/stores/quiz";

import { CommanderSwipe } from "./commander-swipe";
import { QuizDeck } from "./quiz-deck";
import { Shortlist } from "./shortlist";

/** The quiz flow: experience level → question cards → match → commander swipe → shortlist → deck. */
export function QuizScreen() {
  const hydrated = useQuizHydrated();
  const track = useQuizStore((s) => s.track);
  const phase = useQuizStore((s) => s.phase);

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <BrewLoader />
      </div>
    );
  }

  if (track && phase === "swipe") return <CommanderSwipe track={track} />;
  if (track && phase === "shortlist") return <Shortlist track={track} />;
  return <QuizDeck track={track} />;
}
