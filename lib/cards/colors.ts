import type { Color } from "./types";

export const COLORS: Color[] = ["W", "U", "B", "R", "G"];

export const COLOR_NAMES: Record<Color, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
};

export const BASIC_FOR_COLOR: Record<Color, string> = {
  W: "Plains",
  U: "Island",
  B: "Swamp",
  R: "Mountain",
  G: "Forest",
};

const IDENTITY_NAMES: Record<string, string> = {
  "": "Colorless",
  W: "Mono-White",
  U: "Mono-Blue",
  B: "Mono-Black",
  R: "Mono-Red",
  G: "Mono-Green",
  WU: "Azorius",
  UB: "Dimir",
  BR: "Rakdos",
  RG: "Gruul",
  WG: "Selesnya",
  WB: "Orzhov",
  UR: "Izzet",
  BG: "Golgari",
  WR: "Boros",
  UG: "Simic",
  WUB: "Esper",
  UBR: "Grixis",
  BRG: "Jund",
  WRG: "Naya",
  WUG: "Bant",
  WBG: "Abzan",
  WUR: "Jeskai",
  UBG: "Sultai",
  WBR: "Mardu",
  URG: "Temur",
  UBRG: "Glint-Eye",
  WBRG: "Dune-Brood",
  WURG: "Ink-Treader",
  WUBG: "Witch-Maw",
  WUBR: "Yore-Tiller",
  WUBRG: "Five-Color",
};

export function sortColors(colors: readonly string[]): Color[] {
  return COLORS.filter((c) => colors.includes(c));
}

export function identityName(colors: readonly Color[]): string {
  return IDENTITY_NAMES[sortColors(colors).join("")] ?? sortColors(colors).join("");
}

/** True when every color of `card` is inside the commander's color identity. */
export function fitsIdentity(card: readonly Color[], commander: readonly Color[]): boolean {
  return card.every((c) => commander.includes(c));
}
