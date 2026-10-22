"use client";

import { useMemo } from "react";

import { useCommanders } from "@/lib/data/client";
import { QUESTIONS } from "@/lib/quiz/questions";
import { buildProfile, createScoringContext, rankCommanders } from "@/lib/quiz/scoring";
import type { ScoredCommander, Track } from "@/lib/quiz/types";
import { useQuizStore } from "@/stores/quiz";

/** Every commander ranked for the saved answers and the current popularity setting. */
export function useQuizRanking(track: Track) {
  const commanders = useCommanders();
  const answers = useQuizStore((s) => s.answers);
  const popularity = useQuizStore((s) => s.popularity);

  const context = useMemo(() => (commanders.data ? createScoringContext(commanders.data) : null), [commanders.data]);
  const profile = useMemo(() => buildProfile(track, QUESTIONS[track], answers), [track, answers]);
  const ranked = useMemo(
    () => (commanders.data && context ? rankCommanders(commanders.data, profile, popularity, context) : []),
    [commanders.data, context, profile, popularity],
  );
  const byId = useMemo(() => new Map<string, ScoredCommander>(ranked.map((r) => [r.commander.id, r])), [ranked]);

  return { ranked, byId, topScore: ranked[0]?.score ?? 0, isLoading: commanders.isLoading, error: commanders.error };
}

/** Score as a match percentage of the best commander's score. */
export function matchPercent(score: number, topScore: number): number {
  if (topScore <= 0) return 0;
  return Math.max(1, Math.min(99, Math.round((score / topScore) * 99)));
}
