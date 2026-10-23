import { edhrecSlug, frontFaceName } from "./names";
import type { Card } from "./types";

/**
 * An ability that lets a commander share the command zone with a second one. Partner variants with a
 * name after the dash ("Partner—Friends forever", "Partner—Survivors") only pair within their group.
 */
export type Pairing =
  | { kind: "partner"; group: string | null }
  | { kind: "partner-with"; name: string }
  | { kind: "choose-background" }
  | { kind: "background" }
  | { kind: "doctors-companion" }
  | { kind: "doctor" };

/** What `canPair` needs to know about a card. */
export interface Pairable {
  name: string;
  pairings: readonly Pairing[];
}

/** A deck card or commander summary with its pairing abilities, worked out from the rules text when needed. */
export function asPairable(card: Pick<Card, "name" | "typeLine" | "oracleText"> | (Pairable & Pick<Card, "typeLine">)): Pairable {
  return "pairings" in card ? card : { name: card.name, pairings: pairingsOf(card) };
}

/** The pairing abilities in a card's rules text and type line. */
export function pairingsOf(card: Pick<Card, "typeLine" | "oracleText">): Pairing[] {
  const text = card.oracleText;
  const front = card.typeLine.split(" // ")[0];
  const pairings: Pairing[] = [];

  const partnerWith = text.match(/^Partner with ([^(\n]+?)\s*(?:\(|$)/m);
  if (partnerWith) pairings.push({ kind: "partner-with", name: partnerWith[1] });
  const group = text.match(/^(?:Partner—([^(\n]+?)|(Friends forever))\s*(?:\(|$)/m);
  if (group) pairings.push({ kind: "partner", group: group[1] ?? group[2] });
  else if (/^Partner\s*(?:\(|$)/m.test(text)) pairings.push({ kind: "partner", group: null });
  if (/^Choose a Background\b/m.test(text)) pairings.push({ kind: "choose-background" });
  if (/^Doctor's companion\b/m.test(text)) pairings.push({ kind: "doctors-companion" });

  if (front.includes("Legendary") && front.includes("Background")) pairings.push({ kind: "background" });
  if (front.includes("Legendary") && front.includes("Creature") && front.includes("Time Lord Doctor")) {
    pairings.push({ kind: "doctor" });
  }
  return pairings;
}

function matches(a: Pairing, b: Pairing, bName: string): boolean {
  switch (a.kind) {
    case "partner":
      return b.kind === "partner" && a.group === b.group;
    case "partner-with":
      return a.name === bName || a.name === frontFaceName(bName);
    case "choose-background":
      return b.kind === "background";
    case "background":
      return b.kind === "choose-background";
    case "doctors-companion":
      return b.kind === "doctor";
    case "doctor":
      return b.kind === "doctors-companion";
  }
}

/** Whether `a` and `b` may be commanders of the same deck. */
export function canPair(a: Pairable, b: Pairable): boolean {
  if (a.name === b.name) return false;
  return a.pairings.some((pa) => b.pairings.some((pb) => matches(pa, pb, b.name) && matches(pb, pa, a.name)));
}

/** A Background only ever joins a commander that chooses one; it cannot lead a deck. */
export function isBackground(card: Pairable): boolean {
  return card.pairings.some((p) => p.kind === "background");
}

/** Whether the commander can take a second commander, so the setup offers to pick one. */
export function takesSecondCommander(card: Pairable): boolean {
  return card.pairings.some((p) => p.kind !== "background");
}

/**
 * The pairing ability a player sees on the card, e.g. "Partner—Survivors" or "Choose a Background".
 * Doctors are left out: any Doctor can take a companion, which is not why one picks a Doctor.
 */
export function pairingLabel(card: Pairable): string | null {
  const shown = card.pairings.find((p) => p.kind !== "doctor" && p.kind !== "background");
  if (!shown) return null;
  switch (shown.kind) {
    case "partner":
      return shown.group ? `Partner—${shown.group}` : "Partner";
    case "partner-with":
      return `Partner with ${frontFaceName(shown.name).split(",")[0]}`;
    case "choose-background":
      return "Choose a Background";
    case "doctors-companion":
      return "Doctor's companion";
  }
}

/** What the second commander slot holds for this commander: "Partner", "Background", "Doctor" or "Companion". */
export function secondCommanderLabel(card: Pairable): string {
  const kinds = new Set(card.pairings.map((p) => p.kind));
  if (kinds.has("partner") || kinds.has("partner-with")) return "Partner";
  if (kinds.has("choose-background")) return "Background";
  if (kinds.has("doctors-companion")) return "Doctor";
  return "Companion";
}

/**
 * EDHREC's page slug for one or two commanders, e.g. "kraum-ludevics-opus-tymna-the-weaver". Pairs go
 * in EDHREC's order: the Doctor first, a Background last, partners alphabetically. EDHREC answers
 * any other order with a redirect, which the fetch follows.
 */
export function commandZoneSlug(commanders: readonly Pick<Card, "name" | "typeLine">[]): string {
  const rank = (c: Pick<Card, "typeLine">) => (c.typeLine.includes("Time Lord Doctor") ? 0 : c.typeLine.includes("Background") ? 2 : 1);
  return [...commanders]
    .sort((a, b) => rank(a) - rank(b) || edhrecSlug(a.name).localeCompare(edhrecSlug(b.name)))
    .map((c) => edhrecSlug(c.name))
    .join("-");
}

/** Short name for a pair, e.g. "Tymna & Kraum" or "Wilson & Raised by Giants". */
export function commandZoneName(commanders: readonly { name: string }[]): string {
  if (commanders.length === 1) return frontFaceName(commanders[0].name);
  return commanders.map((c) => frontFaceName(c.name).split(",")[0]).join(" & ");
}
