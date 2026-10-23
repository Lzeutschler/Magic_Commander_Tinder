import { describe, expect, it } from "vitest";

import { card } from "@/tests/fixtures";

import { decodeSharedDeck, encodeSharedDeck } from "./share";

const deck = {
  name: "Goblins\nall the way down",
  bracket: 2 as const,
  theme: "tokens",
  commander: card({ name: "Krenko, Mob Boss" }),
  entries: [
    { card: card({ name: "Sol Ring" }), quantity: 1 },
    { card: card({ name: "Mountain" }), quantity: 30 },
    { card: card({ name: "Fable of the Mirror-Breaker // Reflection of Kiki-Jiki" }), quantity: 1 },
  ],
};

/** Deflates `text` the way share codes are made, for codes the encoder would never write. */
async function rawCode(text: string): Promise<string> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

describe("shared deck codes", () => {
  it("round-trip a deck with quantities, double-faced names and a one-line name", async () => {
    const code = await encodeSharedDeck(deck);
    expect(code).toMatch(/^[\w-]+$/);
    expect(await decodeSharedDeck(code)).toEqual({
      name: "Goblins all the way down",
      bracket: 2,
      theme: "tokens",
      commander: "Krenko, Mob Boss",
      cards: [
        { name: "Fable of the Mirror-Breaker // Reflection of Kiki-Jiki", quantity: 1 },
        { name: "Mountain", quantity: 30 },
        { name: "Sol Ring", quantity: 1 },
      ],
    });
  });

  it("keep a deck without a theme", async () => {
    const decoded = await decodeSharedDeck(await encodeSharedDeck({ ...deck, theme: null }));
    expect(decoded?.theme).toBeNull();
  });

  it("reject codes that are not share codes", async () => {
    expect(await decodeSharedDeck("")).toBeNull();
    expect(await decodeSharedDeck("not a code!")).toBeNull();
    expect(await decodeSharedDeck("AAAA")).toBeNull();
    expect(await decodeSharedDeck(await rawCode("2\n3\n\nDeck\nKrenko, Mob Boss\nSol Ring"))).toBeNull();
    expect(await decodeSharedDeck(await rawCode("1\n9\n\nDeck\nKrenko, Mob Boss\nSol Ring"))).toBeNull();
    expect(await decodeSharedDeck(await rawCode("1\n3\n\nDeck\nKrenko, Mob Boss\n0\tSol Ring"))).toBeNull();
  });

  it("refuse codes that inflate to more than a deck list", async () => {
    const bomb = await rawCode(`1\n3\n\nDeck\nKrenko, Mob Boss\n${"Sol Ring ".repeat(10_000)}`);
    expect(bomb.length).toBeLessThan(1_000);
    expect(await decodeSharedDeck(bomb)).toBeNull();
  });
});
