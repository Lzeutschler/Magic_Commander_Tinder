import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { rolesFromText } from "@/lib/tagging/roles";
import { detectThemes } from "@/lib/tagging/themes";
import { creatureTypes, detectTribes } from "@/lib/tagging/tribes";

import { colorPips, curveBucket } from "./mana";
import { edhrecSlug } from "./names";
import type { Card } from "./types";

describe("names", () => {
  it.each([
    ["Atraxa, Praetors' Voice", "atraxa-praetors-voice"],
    ["Esika, God of the Tree // The Prismatic Bridge", "esika-god-of-the-tree"],
    ["Jötun Grunt", "jotun-grunt"],
    ["Æther Vial", "aether-vial"],
  ])("slugs %s", (name, slug) => expect(edhrecSlug(name)).toBe(slug));
});

describe("mana", () => {
  it("counts pips including hybrid and phyrexian", () => {
    expect(colorPips("{2}{W}{W}{U/B}{G/P}")).toEqual({ W: 2, U: 0.5, B: 0.5, G: 1 });
  });
  it("buckets mana values", () => {
    expect([0, 1, 2, 5, 6, 9].map(curveBucket)).toEqual([0, 0, 1, 4, 5, 5]);
  });
});

describe("tagging", () => {
  it("falls back to text patterns for untagged cards", () => {
    expect(rolesFromText("Destroy target creature.", false)).toEqual(["removal"]);
    expect(rolesFromText("{T}: Add {G}.", true)).toEqual([]);
    expect(rolesFromText("Draw two cards.", false)).toEqual(["draw"]);
  });
  it("finds commander themes and tribes", () => {
    const krenko = "{T}: Create X 1/1 red Goblin creature tokens, where X is the number of Goblins you control.";
    expect(detectThemes(krenko)).toContain("tokens");
    expect(detectTribes(krenko, "Krenko, Mob Boss")).toEqual(["Goblin"]);
    expect(creatureTypes("Legendary Creature — Elf Druid")).toEqual(["Elf", "Druid"]);
  });
});

// Checks the generated database (pnpm data) against cards whose roles are well known.
const cardsFile = path.join(process.cwd(), "data/cards.json");
describe.skipIf(!existsSync(cardsFile))("generated card data", () => {
  const cards = JSON.parse(readFileSync(cardsFile, "utf8")) as Card[];
  const byName = new Map(cards.map((c) => [c.name, c]));

  it.each([
    ["Sol Ring", "ramp"],
    ["Cultivate", "ramp"],
    ["Swords to Plowshares", "removal"],
    ["Wrath of God", "boardwipe"],
    ["Counterspell", "counterspell"],
    ["Demonic Tutor", "tutor"],
    ["Rhystic Study", "draw"],
    ["Armageddon", "mld"],
    ["Time Warp", "extraturn"],
  ])("%s has role %s", (name, role) => {
    expect(byName.get(name)?.roles).toContain(role);
  });

  it("flags Game Changers and keeps lands out of ramp", () => {
    expect(byName.get("Rhystic Study")?.gameChanger).toBe(true);
    expect(byName.get("Sol Ring")?.gameChanger).toBe(false);
    expect(byName.get("Command Tower")?.roles).not.toContain("ramp");
    expect(byName.get("Wrath of God")?.roles).not.toContain("removal");
  });
});
