"use client";

import { useMemo, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { SwipeDecision } from "@/lib/deckbuilder/session";
import { answersOf } from "@/lib/quiz/deck";
import { QUESTIONS } from "@/lib/quiz/questions";
import { defaultPopularity } from "@/lib/quiz/scoring";
import type { Answers, PopularityMode, QuizSwipe, Track } from "@/lib/quiz/types";

/** Commanders per swipe round; "keep swiping" adds another round. */
export const SWIPE_ROUND = 30;

export type QuizPhase = "questions" | "swipe" | "shortlist";

interface QuizStore {
  track: Track | null;
  /** Answered quiz cards in order, so the deck can adapt to them and they can be undone. */
  swipes: QuizSwipe[];
  phase: QuizPhase;
  popularity: PopularityMode;
  /** Swipe decisions in order, so they can be undone. */
  decisions: { commanderId: string; decision: SwipeDecision }[];
  /** How many commanders to swipe before the shortlist is suggested. */
  limit: number;

  chooseTrack(track: Track): void;
  swipe(swipe: QuizSwipe): void;
  /** Takes back the last quiz card; before the first one, returns to the track choice. */
  undoSwipe(): void;
  /** Asks a question again, and every question after it. */
  reviseQuestion(questionId: string): void;
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
  swipes: [],
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

      swipe(swipe) {
        set((s) => (s.swipes.some((w) => w.card === swipe.card) ? s : { swipes: [...s.swipes, swipe] }));
      },

      undoSwipe() {
        set((s) => (s.swipes.length ? { swipes: s.swipes.slice(0, -1), phase: "questions" } : { track: null }));
      },

      reviseQuestion(questionId) {
        set((s) => {
          if (!s.track) return s;
          const order = QUESTIONS[s.track].map((q) => q.id);
          const cut = order.indexOf(questionId);
          return { swipes: s.swipes.filter((w) => order.indexOf(w.question) < cut), phase: "questions" };
        });
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
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate(persisted, version) {
        const state = persisted as Partial<QuizStore> & { answers?: Answers; step?: number };
        if (version >= 2) return state;
        // Version 1 kept answers per question. Mid-question quizzes start over, answered ones keep
        // their answers as one finished card per question.
        const { answers = {}, step: _, ...rest } = state;
        const questions = rest.track && rest.phase !== "questions" ? QUESTIONS[rest.track] : [];
        const swipes: QuizSwipe[] = questions.map((q) => ({
          card: q.id,
          question: q.id,
          choice: "done",
          answers: Object.fromEntries([q, ...(q.followUp ? [q.followUp] : [])].map((p) => [p.id, answers[p.id] ?? []])),
        }));
        return { ...rest, swipes };
      },
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

/** The answers of every swipe so far. */
export function useQuizAnswers(): Answers {
  const swipes = useQuizStore((s) => s.swipes);
  return useMemo(() => answersOf(swipes), [swipes]);
}
