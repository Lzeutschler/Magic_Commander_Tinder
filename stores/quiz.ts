"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { SwipeDecision } from "@/lib/deckbuilder/session";
import { defaultPopularity } from "@/lib/quiz/scoring";
import type { Answers, PopularityMode, Track } from "@/lib/quiz/types";

/** Commanders per swipe round; "keep swiping" adds another round. */
export const SWIPE_ROUND = 30;

export type QuizPhase = "questions" | "swipe" | "shortlist";

interface QuizStore {
  track: Track | null;
  /** Index of the current question of the track. */
  step: number;
  answers: Answers;
  phase: QuizPhase;
  popularity: PopularityMode;
  /** Swipe decisions in order, so they can be undone. */
  decisions: { commanderId: string; decision: SwipeDecision }[];
  /** How many commanders to swipe before the shortlist is suggested. */
  limit: number;

  chooseTrack(track: Track): void;
  answer(questionId: string, optionIds: string[]): void;
  goToStep(step: number): void;
  /** Leaves the questions; going back from the first question returns to the track choice. */
  back(): void;
  startSwiping(): void;
  decide(commanderId: string, decision: SwipeDecision): void;
  undo(): void;
  setPopularity(mode: PopularityMode): void;
  keepSwiping(): void;
  showShortlist(): void;
  /** Turns a shortlisted commander into a pass. */
  removeFromShortlist(commanderId: string): void;
  restart(): void;
}

const INITIAL = {
  track: null,
  step: 0,
  answers: {},
  phase: "questions" as QuizPhase,
  popularity: "balanced" as PopularityMode,
  decisions: [],
  limit: SWIPE_ROUND,
};

export const useQuizStore = create<QuizStore>()(
  persist(
    (set) => ({
      ...INITIAL,

      chooseTrack(track) {
        set({ ...INITIAL, track, popularity: defaultPopularity(track) });
      },

      answer(questionId, optionIds) {
        set((s) => ({ answers: { ...s.answers, [questionId]: optionIds } }));
      },

      goToStep(step) {
        set({ step, phase: "questions" });
      },

      back() {
        set((s) => (s.step === 0 ? { track: null } : { step: s.step - 1 }));
      },

      startSwiping() {
        set({ phase: "swipe", decisions: [], limit: SWIPE_ROUND });
      },

      decide(commanderId, decision) {
        set((s) =>
          s.decisions.some((d) => d.commanderId === commanderId)
            ? s
            : { decisions: [...s.decisions, { commanderId, decision }] },
        );
      },

      undo() {
        set((s) => ({ decisions: s.decisions.slice(0, -1) }));
      },

      setPopularity(popularity) {
        set({ popularity });
      },

      keepSwiping() {
        set((s) => ({ phase: "swipe", limit: Math.max(s.limit, s.decisions.length) + SWIPE_ROUND }));
      },

      showShortlist() {
        set({ phase: "shortlist" });
      },

      removeFromShortlist(commanderId) {
        set((s) => ({
          decisions: s.decisions.map((d) => (d.commanderId === commanderId ? { ...d, decision: "pass" } : d)),
        }));
      },

      restart() {
        set(INITIAL);
      },
    }),
    {
      name: "commander-tinder-quiz",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** False during SSR and until the saved quiz has been read from localStorage. */
export function useQuizHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useQuizStore.persist.onFinishHydration(onChange),
    () => useQuizStore.persist.hasHydrated(),
    () => false,
  );
}
