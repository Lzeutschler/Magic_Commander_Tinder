/** Front face of a multi-faced card name ("Esika, God of the Tree // The Prismatic Bridge" → "Esika, God of the Tree"). */
export function frontFaceName(name: string): string {
  return name.split(" // ")[0];
}

/** Lookup key for case- and accent-insensitive name matching. */
export function nameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’`]/g, "'")
    .trim();
}

/** EDHREC page slug for a card name, e.g. "Atraxa, Praetors' Voice" → "atraxa-praetors-voice". */
export function edhrecSlug(name: string): string {
  return nameKey(frontFaceName(name))
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const BASIC_LAND_NAMES = new Set([
  "Plains",
  "Island",
  "Swamp",
  "Mountain",
  "Forest",
  "Wastes",
  "Snow-Covered Plains",
  "Snow-Covered Island",
  "Snow-Covered Swamp",
  "Snow-Covered Mountain",
  "Snow-Covered Forest",
  "Snow-Covered Wastes",
]);

export function isBasicLandName(name: string): boolean {
  return BASIC_LAND_NAMES.has(name);
}

/** Cards that may appear any number of times in a Commander deck. */
export function allowsMultipleCopies(name: string, oracleText: string): boolean {
  return isBasicLandName(name) || /a deck can have any number of cards named/i.test(oracleText);
}
