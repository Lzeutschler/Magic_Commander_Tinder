import { edhrecSlug } from "@/lib/cards/names";
import { commandZoneSlug } from "@/lib/cards/pairing";
import type { Card } from "@/lib/cards/types";

import { BRACKET_SLUGS, type Bracket } from "./types";

const EDHREC_URL = "https://edhrec.com";

/**
 * The EDHREC page behind the numbers we show for a commander or a pair of them, narrowed like the data
 * we used, e.g. https://edhrec.com/commanders/krenko-mob-boss/core/tokens.
 */
export function edhrecCommanderUrl(
  commanders: readonly Pick<Card, "name" | "typeLine">[],
  bracket?: Bracket,
  theme?: string | null,
): string {
  const segments = [commandZoneSlug(commanders), bracket ? BRACKET_SLUGS[bracket] : null, theme].filter(Boolean);
  return `${EDHREC_URL}/commanders/${segments.join("/")}`;
}

/** A card's EDHREC page, e.g. https://edhrec.com/cards/sol-ring. */
export function edhrecCardUrl(name: string): string {
  return `${EDHREC_URL}/cards/${edhrecSlug(name)}`;
}
