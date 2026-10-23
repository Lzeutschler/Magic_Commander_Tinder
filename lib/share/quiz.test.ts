import { describe, expect, it } from "vitest";

import { packText } from "./code";
import { decodeSharedQuiz, encodeSharedQuiz, MAX_SHARED_MATCHES } from "./quiz";

const quiz = {
  track: "beginner" as const,
  matches: [
    { name: "Sauron, the Dark Lord", percent: 96, reasons: ["From The Lord of the Rings", "Black fits\tyour vibe", "dropped"] },
    { name: "Ardyn, the Usurper", percent: 81, reasons: [] },
  ],
};

describe("shared quiz codes", () => {
  it("round-trip the matches with at most two one-line reasons each", async () => {
    expect(await decodeSharedQuiz(await encodeSharedQuiz(quiz))).toEqual({
      track: "beginner",
      matches: [
        { name: "Sauron, the Dark Lord", percent: 96, reasons: ["From The Lord of the Rings", "Black fits your vibe"] },
        { name: "Ardyn, the Usurper", percent: 81, reasons: [] },
      ],
    });
  });

  it("keep only the top of a long shortlist", async () => {
    const many = { ...quiz, matches: Array.from({ length: 12 }, (_, i) => ({ name: `Commander ${i}`, percent: 90 - i, reasons: [] })) };
    expect((await decodeSharedQuiz(await encodeSharedQuiz(many)))?.matches).toHaveLength(MAX_SHARED_MATCHES);
  });

  it("reject codes that are not quiz results", async () => {
    expect(await decodeSharedQuiz("not a code!")).toBeNull();
    expect(await decodeSharedQuiz(await packText("1\nexpert\nSauron, the Dark Lord\t96"))).toBeNull();
    expect(await decodeSharedQuiz(await packText("1\nbeginner\nSauron, the Dark Lord\t140"))).toBeNull();
    expect(await decodeSharedQuiz(await packText("1\nbeginner\n"))).toBeNull();
  });
});
