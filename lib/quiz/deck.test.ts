import { describe, expect, it } from "vitest";

import { answersOf, nextCard, pickedOptions, swipeFor, trackCard, type QuizCard } from "./deck";
import { QUESTIONS } from "./questions";
import { buildProfile } from "./scoring";
import type { QuizChoice, QuizSwipe, Track } from "./types";

/** Swipes through a whole track, answering every card with `choose`. */
function play(track: Track, choose: (card: QuizCard) => QuizChoice): QuizSwipe[] {
  const swipes: QuizSwipe[] = [];
  for (let card = nextCard(track, swipes); card; card = nextCard(track, swipes)) swipes.push(swipeFor(card, choose(card)));
  return swipes;
}

/** Answers as a cautious player: no, the left side, skip. */
const declineAll = (card: QuizCard): QuizChoice => ({ yesno: "no", gate: "no", versus: "left", pick: "skip" } as const)[card.kind];

/** The swipes up to the first card of `questionId`. */
function answerUntil(track: Track, questionId: string, choice: (card: QuizCard) => QuizChoice): QuizSwipe[] {
  const swipes: QuizSwipe[] = [];
  for (let card = nextCard(track, swipes); card && card.question.id !== questionId; card = nextCard(track, swipes)) {
    swipes.push(swipeFor(card, choice(card)));
  }
  return swipes;
}

describe("quiz deck", () => {
  it("starts with the track choice, then each track's first question", () => {
    const card = trackCard();
    expect(card.kind === "versus" && [card.left.id, card.right.id]).toEqual(["beginner", "advanced"]);
    expect(nextCard("advanced", [])?.id).toBe("win:army");
    expect(nextCard("beginner", [])?.id).toBe("side:hero");
  });

  it("refers only to answers its questions have", () => {
    for (const questions of Object.values(QUESTIONS)) {
      for (const q of questions) {
        if (q.card.kind === "versus") {
          for (const id of [q.card.left, q.card.right, q.card.middle].filter(Boolean)) expect(q.options.map((o) => o.id)).toContain(id);
        }
        // Only a gate can answer "none of these".
        if (q.options.some((o) => o.exclusive)) expect(q.card.kind === "pick" && q.card.gate).toBeTruthy();
      }
    }
  });

  it("stops asking yes/no answers once the question has its most yeses", () => {
    const swipes = [swipeFor(nextCard("advanced", [])!, "yes")];
    swipes.push(swipeFor(nextCard("advanced", swipes)!, "yes"));
    expect(answersOf(swipes).win).toEqual(["army", "champion"]);
    expect(nextCard("advanced", swipes)?.id).toBe("engine");
  });

  it("asks the answers that fit earlier swipes first", () => {
    // Drain the table → "Punish everything they do" leads the table question.
    const swipes = answerUntil("advanced", "table", (card) => (card.id === "win:drain" ? "yes" : card.kind === "pick" ? "skip" : "no"));
    expect(nextCard("advanced", swipes)?.id).toBe("table:punish");
    // Villains in the dark meet vampires and zombies before squirrels.
    const vibes = [swipeFor(nextCard("beginner", [])!, "no")];
    vibes.push(swipeFor(nextCard("beginner", vibes)!, "yes"));
    expect(answersOf(vibes).side).toEqual(["villain"]);
    vibes.push(swipeFor(nextCard("beginner", vibes)!, "done", { mood: ["spooky"] }));
    expect(["critters:vampire", "critters:zombie"]).toContain(nextCard("beginner", vibes)?.id);
  });

  it("keeps long yes/no questions short", () => {
    const swipes = play("advanced", declineAll);
    expect(swipes.filter((s) => s.question === "table")).toHaveLength(4);
    expect(swipes.filter((s) => s.question === "win")).toHaveLength(6);
    expect(swipes.length).toBeLessThanOrEqual(16);
    expect(play("beginner", declineAll).length).toBeLessThanOrEqual(16);
  });

  it("skips a gated list on no and answers it with none", () => {
    const swipes = answerUntil("advanced", "tribe", declineAll);
    const gate = nextCard("advanced", swipes)!;
    expect(gate.kind).toBe("gate");
    expect(nextCard("advanced", [...swipes, swipeFor(gate, "no")])).toBeNull();
    expect(buildProfile("advanced", QUESTIONS.advanced, answersOf([...swipes, swipeFor(gate, "no")])).noTribe).toBe(true);
    expect(nextCard("advanced", [...swipes, swipeFor(gate, "yes")])?.kind).toBe("pick");
  });

  it("turns versus sides and pick cards into answers", () => {
    const swipes = answerUntil("advanced", "tempo", declineAll);
    const tempo = nextCard("advanced", swipes)!;
    expect(swipeFor(tempo, "middle").answers).toEqual({ tempo: ["engine"] });
    expect(swipeFor(tempo, "right").answers).toEqual({ tempo: ["big"] });

    const colors = nextCard("advanced", answerUntil("advanced", "colors", declineAll))!;
    const picked = { colors: ["W", "B"], colorCount: ["two"] };
    expect(swipeFor(colors, "done", picked).answers).toEqual(picked);
    expect(swipeFor(colors, "skip", picked).answers).toEqual({});
    expect(pickedOptions("advanced", picked).find((p) => p.question.id === "colors")?.options.map((o) => o.label)).toEqual([
      "White",
      "Black",
      "2 colors",
    ]);
  });

  it("treats a finished card with the question's id as the whole question answered", () => {
    const migrated: QuizSwipe[] = QUESTIONS.beginner.map((q) => ({ card: q.id, question: q.id, choice: "done", answers: {} }));
    expect(nextCard("beginner", migrated)).toBeNull();
  });
});
