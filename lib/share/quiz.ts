import type { Track } from "@/lib/quiz/types";

import { packText, unpackText } from "./code";

/** First line of every shared quiz result, so the format can change without breaking old links. */
const VERSION = "1";
/** A link carries the top of the shortlist with a couple of reasons each. */
export const MAX_SHARED_MATCHES = 8;
const MAX_REASONS = 2;
const MAX_TEXT_LENGTH = 200;

export interface SharedMatch {
  name: string;
  /** Match percentage as the quiz showed it, 1..99. */
  percent: number;
  /** Why the commander fits, in the words the quiz used. */
  reasons: string[];
}

export interface SharedQuiz {
  track: Track;
  matches: SharedMatch[];
}

/** The text a quiz link carries: version, track, then "name<tab>percent<tab>reason<tab>reason" per commander. */
export function sharedQuizText(quiz: SharedQuiz): string {
  const lines = quiz.matches
    .slice(0, MAX_SHARED_MATCHES)
    .map((m) => [m.name, String(m.percent), ...m.reasons.slice(0, MAX_REASONS)].map(oneLine).join("\t"));
  return [VERSION, quiz.track, ...lines].join("\n");
}

export function encodeSharedQuiz(quiz: SharedQuiz): Promise<string> {
  return packText(sharedQuizText(quiz));
}

/** The quiz result in `code`, or null for anything that is not a valid share code. */
export async function decodeSharedQuiz(code: string): Promise<SharedQuiz | null> {
  const text = await unpackText(code);
  if (text === null) return null;

  const [version, track, ...lines] = text.split("\n");
  if (version !== VERSION || (track !== "beginner" && track !== "advanced")) return null;
  const matches = lines
    .filter(Boolean)
    .slice(0, MAX_SHARED_MATCHES)
    .map((line) => {
      const [name, percent, ...reasons] = line.split("\t");
      return { name, percent: Number(percent), reasons: reasons.slice(0, MAX_REASONS) };
    });
  const valid = (s: string) => s.length > 0 && s.length <= MAX_TEXT_LENGTH;
  if (!matches.length || matches.some((m) => !valid(m.name) || !Number.isInteger(m.percent) || m.percent < 1 || m.percent > 99 || !m.reasons.every(valid))) {
    return null;
  }
  return { track, matches };
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH);
}
