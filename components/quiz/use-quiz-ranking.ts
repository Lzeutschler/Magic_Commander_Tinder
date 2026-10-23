"use client";

import { useMemo } from "react";

import { isBackground } from "@/lib/cards/pairing";
import { useCommanders } from "@/lib/data/client";
import { QUESTIONS } from "@/lib/quiz/questions";
import { buildProfile, createScoringContext, rankCommanders } from "@/lib/quiz/scoring";
import type { ScoredCommander, Track } from "@/lib/quiz/types";
import { useQuizAnswers, useQuizStore } from "@/stores/quiz";

/** Every commander ranked for the saved answers and the current popularity setting. */
export function useQuizRanking(track: Track) {
  const commanders = useCommanders();
  const answers = useQuizAnswers();
  const popularity = useQuizStore((s) => s.popularity);

  // Backgrounds only join a commander, so they are never a match on their own.
  const leaders = useMemo(() => commanders.data?.filter((c) => !isBackground(c)), [commanders.data]);
  const context = useMemo(() => (leaders ? createScoringContext(leaders) : null), [leaders]);
  const profile = useMemo(() => buildProfile(track, QUESTIONS[track], answers), [track, answers]);
  const ranked = useMemo(
    () => (leaders && context ? rankCommanders(leaders, profile, popularity, context) : []),
    [leaders, context, profile, popularity],
  );
  const byId = useMemo(() => new Map<string, ScoredCommander>(ranked.map((r) => [r.commander.id, r])), [ranked]);

  return { ranked, byId, topScore: ranked[0]?.score ?? 0, isLoading: commanders.isLoading, error: commanders.error };
}

/** Score as a match percentage of the best commander's score. */
export function matchPercent(score: number, topScore: number): number {
  if (topScore <= 0) return 0;
  return Math.max(1, Math.min(99, Math.round((score / topScore) * 99)));
}
