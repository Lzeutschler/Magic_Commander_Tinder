import "server-only";

import { cache } from "react";

import type { Card } from "@/lib/cards/types";
import type { Track } from "@/lib/quiz/types";
import { decodeSharedQuiz } from "@/lib/share/quiz";

import { findCard, getCardDb } from "./card-db";

export interface ResolvedSharedQuiz {
  track: Track;
  matches: { card: Card; percent: number; reasons: string[] }[];
}

/**
 * The quiz result behind a share code with its commanders looked up, or null when the code is broken
 * or none of them is known. Cached per request, since the page, its metadata and its image all need it.
 */
export const loadSharedQuiz = cache(async (code: string): Promise<ResolvedSharedQuiz | null> => {
  const shared = await decodeSharedQuiz(code);
  if (!shared) return null;
  const db = await getCardDb();
  const matches = shared.matches.flatMap(({ name, percent, reasons }) => {
    const card = findCard(db, name);
    return card ? [{ card, percent, reasons }] : [];
  });
  return matches.length ? { track: shared.track, matches } : null;
});
