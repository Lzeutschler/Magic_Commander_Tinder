/**
 * Where deck statistics come from: "edhrec" reads EDHREC's JSON pages, "off" asks nobody and leaves
 * suggestions to the heuristic fallback built from Scryfall data.
 */
export type RecsSource = "edhrec" | "off";

const SOURCES: readonly string[] = ["edhrec", "off"] satisfies RecsSource[];

let warned = false;

/**
 * The RECS_SOURCE environment variable, read by the server per request and by the card database
 * script at build time. Unset means EDHREC; an unknown value turns statistics off rather than guessing.
 */
export function recsSource(): RecsSource {
  const value = process.env.RECS_SOURCE?.trim().toLowerCase();
  if (!value) return "edhrec";
  if (SOURCES.includes(value)) return value as RecsSource;
  if (!warned) {
    warned = true;
    console.warn(`[recs] unknown RECS_SOURCE "${value}", deck statistics are off (use ${SOURCES.join(" or ")})`);
  }
  return "off";
}
