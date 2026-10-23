export type Bracket = 1 | 2 | 3 | 4 | 5;

export const BRACKETS: Bracket[] = [1, 2, 3, 4, 5];

/**
 * Whether `value` can be an EDHREC page segment (commander or pair, bracket or theme slug): lowercase
 * words joined by hyphens. Anything else, such as "../", must never reach an EDHREC URL.
 */
export function isEdhrecSlug(value: string): boolean {
  return value.length <= 160 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

/** EDHREC URL segment for each Commander bracket. */
export const BRACKET_SLUGS: Record<Bracket, string> = {
  1: "exhibition",
  2: "core",
  3: "upgraded",
  4: "optimized",
  5: "cedh",
};
