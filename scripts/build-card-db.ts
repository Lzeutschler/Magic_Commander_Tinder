/**
 * Builds the card database from Scryfall bulk data.
 *
 * Outputs:
 *   data/cards.json            every Commander-legal card (server only)
 *   data/tokens.json           token cards for the goldfish sandbox (server only)
 *   public/data/commanders.json every legal commander with themes, tribes and archetypes, plus the
 *                              Backgrounds that can join one (client)
 *   data/meta.json             build timestamp and source files
 *
 * Commander archetypes combine Scryfall Tagger tags with EDHREC theme pages (cached in .cache/edhrec),
 * unless RECS_SOURCE turns EDHREC off. Skips work when the data is younger than a week and was built
 * from the same RECS_SOURCE; pass --force to rebuild.
 */
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "node:path";

import { sortColors } from "@/lib/cards/colors";
import { parseScryfallImageUrl } from "@/lib/cards/image";
import { edhrecSlug } from "@/lib/cards/names";
import { pairingsOf } from "@/lib/cards/pairing";
import type { Card, CardImage, CommanderSummary, Role, TokenCard } from "@/lib/cards/types";
import { rulesComplexity } from "@/lib/quiz/scoring";
import { recsSource, type RecsSource } from "@/lib/recs/source";
import { USER_AGENT } from "@/lib/site";
import {
  ARCHETYPES,
  archetypesFromTags,
  archetypesFromText,
  combineArchetypes,
  confirmedTribes,
  type ArchetypeId,
} from "@/lib/tagging/archetypes";
import { ROLES, ROLE_TAGS, extraRolesFromText, rolesFromText } from "@/lib/tagging/roles";
import { detectThemes } from "@/lib/tagging/themes";
import { creatureTypes, detectTribes } from "@/lib/tagging/tribes";

const ROOT = process.cwd();
const CACHE_DIR = path.join(ROOT, ".cache/scryfall");
const EDHREC_CACHE_DIR = path.join(ROOT, ".cache/edhrec");
const DATA_DIR = path.join(ROOT, "data");
const PUBLIC_DATA_DIR = path.join(ROOT, "public/data");
const META_FILE = path.join(DATA_DIR, "meta.json");
const OUTPUTS = [
  path.join(DATA_DIR, "cards.json"),
  path.join(DATA_DIR, "tokens.json"),
  path.join(PUBLIC_DATA_DIR, "commanders.json"),
];
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** Bump when the output format changes so stale local data is rebuilt. */
const SCHEMA_VERSION = 5;
const SCRYFALL_HEADERS = { "User-Agent": USER_AGENT, Accept: "application/json" };
/** EDHREC color identity page slugs, e.g. json.edhrec.com/pages/commanders/orzhov.json. */
const EDHREC_IDENTITIES = [
  "colorless", "mono-white", "mono-blue", "mono-black", "mono-red", "mono-green",
  "azorius", "dimir", "rakdos", "gruul", "selesnya", "orzhov", "izzet", "golgari", "boros", "simic",
  "esper", "grixis", "jund", "naya", "bant", "abzan", "jeskai", "sultai", "mardu", "temur",
  "yore-tiller", "glint-eye", "dune-brood", "ink-treader", "witch-maw", "five-color",
];

interface ScryfallFace {
  name: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  image_uris?: Record<string, string>;
}

interface ScryfallCard {
  id: string;
  oracle_id?: string;
  name: string;
  layout: string;
  mana_cost?: string;
  cmc?: number;
  type_line?: string;
  oracle_text?: string;
  colors?: string[];
  color_identity: string[];
  produced_mana?: string[];
  keywords?: string[];
  power?: string;
  toughness?: string;
  legalities: Record<string, string>;
  edhrec_rank?: number;
  game_changer?: boolean;
  set: string;
  image_uris?: Record<string, string>;
  card_faces?: ScryfallFace[];
  prices?: Record<string, string | null>;
}

interface ScryfallTag {
  id: string;
  slug: string;
  child_ids: string[];
  taggings: { oracle_id: string }[];
}

interface EdhrecCommanderView {
  sanitized: string;
  num_decks?: number;
}

interface EdhrecListPage {
  container: { json_dict: { cardlists: { tag: string; cardviews: EdhrecCommanderView[] }[] } };
}

/** Deck totals and per-archetype deck counts, keyed by EDHREC slug. */
interface EdhrecArchetypeData {
  totals: Map<string, number>;
  themes: Map<string, Partial<Record<ArchetypeId, number>>>;
}

async function main() {
  const force = process.argv.includes("--force");
  if (!force && isFresh()) {
    console.log("[card-db] data is fresh, skipping (use --force to rebuild)");
    return;
  }

  mkdirSync(CACHE_DIR, { recursive: true });
  mkdirSync(DATA_DIR, { recursive: true });
  mkdirSync(PUBLIC_DATA_DIR, { recursive: true });

  const bulk = await fetchJson<{ data: { type: string; jsonl_download_uri: string; updated_at: string }[] }>(
    "https://api.scryfall.com/bulk-data",
  );
  const source = (type: string) => {
    const entry = bulk.data.find((b) => b.type === type);
    if (!entry) throw new Error(`Scryfall bulk type ${type} not found`);
    return entry;
  };
  const cardsSource = source("oracle_cards");
  const tagsSource = source("oracle_tags");

  const recs = recsSource();
  const [cardsFile, tagsFile, edhrec] = await Promise.all([
    download(cardsSource.jsonl_download_uri),
    download(tagsSource.jsonl_download_uri),
    recs === "edhrec" ? fetchEdhrecArchetypes() : noEdhrecArchetypes(),
  ]);

  console.log("[card-db] reading oracle tags");
  const tags: ScryfallTag[] = [];
  for await (const tag of readJsonLines<ScryfallTag>(tagsFile)) tags.push(tag);
  const rolesByOracleId = buildRoleIndex(tags);
  const tagSlugsByOracleId = buildTagSlugIndex(tags);

  console.log("[card-db] reading oracle cards");
  const cards: Card[] = [];
  const tokens: TokenCard[] = [];
  const commanders: CommanderSummary[] = [];

  for await (const raw of readJsonLines<ScryfallCard>(cardsFile)) {
    if (raw.layout === "token" || raw.layout === "double_faced_token") {
      tokens.push(toToken(raw));
      continue;
    }
    if (raw.legalities.commander !== "legal") continue;

    const card = toCard(raw, rolesByOracleId);
    cards.push(card);
    if (isCommander(raw)) commanders.push(toCommander(raw, card, tagSlugsByOracleId.get(card.oracleId) ?? null, edhrec));
  }

  cards.sort((a, b) => a.name.localeCompare(b.name));
  commanders.sort((a, b) => (a.edhrecRank ?? Infinity) - (b.edhrecRank ?? Infinity));

  writeJson(path.join(DATA_DIR, "cards.json"), cards);
  writeJson(path.join(DATA_DIR, "tokens.json"), dedupeTokens(tokens));
  writeJson(path.join(PUBLIC_DATA_DIR, "commanders.json"), commanders);
  writeJson(META_FILE, {
    schema: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    scryfallUpdatedAt: cardsSource.updated_at,
    recsSource: recs,
    cards: cards.length,
    commanders: commanders.length,
    tokens: tokens.length,
  });

  console.log(`[card-db] ${cards.length} cards, ${commanders.length} commanders, ${tokens.length} tokens`);
}

function isFresh(): boolean {
  if (!existsSync(META_FILE) || OUTPUTS.some((f) => !existsSync(f))) return false;
  const meta = JSON.parse(readFileSync(META_FILE, "utf8")) as { generatedAt: string; schema?: number; recsSource?: RecsSource };
  // Data built before RECS_SOURCE existed came from EDHREC.
  const sameSource = (meta.recsSource ?? "edhrec") === recsSource();
  return meta.schema === SCHEMA_VERSION && sameSource && Date.now() - new Date(meta.generatedAt).getTime() < MAX_AGE_MS;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: SCRYFALL_HEADERS });
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return (await res.json()) as T;
}

/** Downloads a bulk file into the cache (file names are timestamped) and prunes older versions. */
async function download(url: string): Promise<string> {
  const fileName = path.basename(new URL(url).pathname);
  const target = path.join(CACHE_DIR, fileName);
  if (existsSync(target)) return target;

  console.log(`[card-db] downloading ${fileName}`);
  const res = await fetch(url, { headers: SCRYFALL_HEADERS });
  if (!res.ok || !res.body) throw new Error(`GET ${url} failed: ${res.status}`);
  await pipeline(Readable.fromWeb(res.body as import("node:stream/web").ReadableStream), createWriteStream(target));

  const prefix = fileName.replace(/-\d+\.jsonl\.gz$/, "");
  for (const old of readdirSync(CACHE_DIR)) {
    if (old !== fileName && old.startsWith(prefix)) unlinkSync(path.join(CACHE_DIR, old));
  }
  return target;
}

async function* readJsonLines<T>(file: string): AsyncGenerator<T> {
  const lines = createInterface({ input: createReadStream(file).pipe(createGunzip()), crlfDelay: Infinity });
  for await (const line of lines) {
    if (line.trim()) yield JSON.parse(line) as T;
  }
}

/** Maps oracle_id → roles, expanding every role tag to all of its descendant tags. */
function buildRoleIndex(tags: ScryfallTag[]): Map<string, Set<Role>> {
  const byId = new Map(tags.map((t) => [t.id, t]));
  const bySlug = new Map(tags.map((t) => [t.slug, t]));

  const descendants = (slugs: string[]): Set<string> => {
    const seen = new Set<string>();
    const stack = slugs.map((s) => bySlug.get(s)?.id).filter((id): id is string => Boolean(id));
    while (stack.length) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      stack.push(...(byId.get(id)?.child_ids ?? []));
    }
    return seen;
  };

  const index = new Map<string, Set<Role>>();
  for (const role of ROLES) {
    const { include, exclude = [], veto = [] } = ROLE_TAGS[role];
    const excluded = descendants(exclude);
    const vetoed = new Set([...descendants(veto)].flatMap((id) => byId.get(id)!.taggings.map((t) => t.oracle_id)));
    for (const tagId of descendants(include)) {
      if (excluded.has(tagId)) continue;
      for (const { oracle_id } of byId.get(tagId)!.taggings) {
        if (vetoed.has(oracle_id)) continue;
        let roles = index.get(oracle_id);
        if (!roles) index.set(oracle_id, (roles = new Set()));
        roles.add(role);
      }
    }
  }

  // Oracle IDs that Tagger knows about at all; untagged cards fall back to text patterns.
  for (const tag of tags) {
    for (const { oracle_id } of tag.taggings) if (!index.has(oracle_id)) index.set(oracle_id, new Set());
  }
  return index;
}

/**
 * Maps oracle_id → the Tagger tags that signal a commander archetype or creature type. Cards Tagger
 * never saw are absent.
 */
function buildTagSlugIndex(tags: ScryfallTag[]): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();
  for (const tag of tags) {
    const signals = tag.slug.startsWith("typal-") || archetypesFromTags([tag.slug]).size > 0;
    for (const { oracle_id } of tag.taggings) {
      let slugs = index.get(oracle_id);
      if (!slugs) index.set(oracle_id, (slugs = new Set()));
      if (signals) slugs.add(tag.slug);
    }
  }
  return index;
}

/**
 * Loads EDHREC's theme pages (top commanders per theme) and color identity pages (deck totals for the
 * top commanders of each identity). EDHREC's JSON is unofficial: every page is cached for a week, a
 * stale copy is used when a request fails, and the build carries on without the pages it cannot get.
 */
async function fetchEdhrecArchetypes(): Promise<EdhrecArchetypeData> {
  mkdirSync(EDHREC_CACHE_DIR, { recursive: true });
  const totals = new Map<string, number>();
  const themes = new Map<string, Partial<Record<ArchetypeId, number>>>();

  const themeJobs = ARCHETYPES.flatMap((a) => a.edhrec.map((slug) => ({ archetype: a.id, page: `tags/${slug}` })));
  const totalJobs = EDHREC_IDENTITIES.map((slug) => ({ archetype: null, page: `commanders/${slug}` }));
  let failed = 0;

  await mapLimit([...themeJobs, ...totalJobs], 6, async ({ archetype, page }) => {
    const views = await edhrecCommanderViews(page);
    if (!views) return void failed++;
    for (const view of views) {
      const decks = view.num_decks ?? 0;
      if (!archetype) {
        totals.set(view.sanitized, Math.max(totals.get(view.sanitized) ?? 0, decks));
        continue;
      }
      const counts = themes.get(view.sanitized) ?? {};
      counts[archetype] = Math.max(counts[archetype] ?? 0, decks);
      themes.set(view.sanitized, counts);
    }
  });

  console.log(`[card-db] EDHREC: ${themes.size} commanders with themes, ${totals.size} deck totals, ${failed} pages missing`);
  return { totals, themes };
}

/** With EDHREC switched off, archetypes rest on Tagger tags and card text alone, and no cached page is read. */
function noEdhrecArchetypes(): EdhrecArchetypeData {
  console.log("[card-db] EDHREC is off (RECS_SOURCE), skipping theme pages");
  return { totals: new Map(), themes: new Map() };
}

async function edhrecCommanderViews(page: string): Promise<EdhrecCommanderView[] | null> {
  const file = path.join(EDHREC_CACHE_DIR, `${page.replace(/\//g, "__")}.json`);
  const cached = existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as { at: number; views: EdhrecCommanderView[] }) : null;
  if (cached && Date.now() - cached.at < MAX_AGE_MS) return cached.views;

  try {
    const res = await fetch(`https://json.edhrec.com/pages/${page}.json`, { headers: SCRYFALL_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as EdhrecListPage;
    const views = json.container.json_dict.cardlists
      .filter((list) => list.tag.includes("commanders"))
      .flatMap((list) => list.cardviews.map(({ sanitized, num_decks }) => ({ sanitized, num_decks })));
    writeFileSync(file, JSON.stringify({ at: Date.now(), views }));
    return views;
  } catch (err) {
    console.warn(`[card-db] EDHREC ${page} failed (${(err as Error).message})${cached ? ", using stale cache" : ""}`);
    return cached?.views ?? null;
  }
}

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await fn(items[next++]);
  };
  await Promise.all(Array.from({ length: limit }, worker));
}

function oracleText(raw: ScryfallCard): string {
  return raw.oracle_text ?? (raw.card_faces ?? []).map((f) => f.oracle_text ?? "").join("\n//\n");
}

function frontTypeLine(raw: ScryfallCard): string {
  return (raw.type_line ?? raw.card_faces?.[0]?.type_line ?? "").split(" // ")[0];
}

function imageOf(raw: { image_uris?: Record<string, string>; card_faces?: ScryfallFace[] }): CardImage | null {
  if (raw.image_uris?.normal) return parseScryfallImageUrl(raw.image_uris.normal, false);
  const face = raw.card_faces?.[0]?.image_uris?.normal;
  return face ? parseScryfallImageUrl(face, true) : null;
}

function priceOf(raw: ScryfallCard): number | null {
  const usd = raw.prices?.usd ?? raw.prices?.usd_foil;
  return usd ? Number(usd) : null;
}

function toCard(raw: ScryfallCard, rolesByOracleId: Map<string, Set<Role>>): Card {
  const text = oracleText(raw);
  const isLand = frontTypeLine(raw).includes("Land");
  const tagged = raw.oracle_id ? rolesByOracleId.get(raw.oracle_id) : undefined;
  let roles = tagged ? [...new Set([...tagged, ...extraRolesFromText(text)])] : rolesFromText(text, isLand);
  // Mana-producing lands are tagged as ramp by Tagger, but they belong to the land count.
  if (isLand) roles = roles.filter((r) => r !== "ramp");
  // A sweeper is not spot removal, and Armageddon is neither: count each card in one slot.
  if (roles.includes("mld")) roles = roles.filter((r) => r !== "removal" && r !== "boardwipe");
  if (roles.includes("boardwipe")) roles = roles.filter((r) => r !== "removal");
  // Deadly Dispute and Big Score draw cards and leave one Treasure: card draw, not a ramp slot.
  if (/\b(Instant|Sorcery)\b/.test(frontTypeLine(raw)) && roles.includes("draw") && /\btreasure\b/i.test(text)) {
    roles = roles.filter((r) => r !== "ramp");
  }

  return {
    id: raw.id,
    oracleId: raw.oracle_id ?? raw.id,
    name: raw.name,
    manaCost: raw.mana_cost ?? raw.card_faces?.map((f) => f.mana_cost ?? "").filter(Boolean).join(" // ") ?? "",
    cmc: raw.cmc ?? 0,
    typeLine: raw.type_line ?? raw.card_faces?.map((f) => f.type_line ?? "").join(" // ") ?? "",
    oracleText: text,
    colorIdentity: sortColors(raw.color_identity),
    producedMana: raw.produced_mana ?? [],
    image: imageOf(raw),
    edhrecRank: raw.edhrec_rank ?? null,
    gameChanger: raw.game_changer ?? false,
    roles: ROLES.filter((r) => roles.includes(r)),
    priceUsd: priceOf(raw),
  };
}

function toToken(raw: ScryfallCard): TokenCard {
  const face = raw.card_faces?.[0];
  return {
    id: raw.id,
    name: raw.name,
    typeLine: raw.type_line ?? face?.type_line ?? "",
    oracleText: oracleText(raw),
    colors: sortColors(raw.colors ?? []),
    power: raw.power ?? face?.power ?? null,
    toughness: raw.toughness ?? face?.toughness ?? null,
    image: imageOf(raw),
  };
}

function dedupeTokens(tokens: TokenCard[]): TokenCard[] {
  const seen = new Set<string>();
  return tokens
    .filter((t) => {
      const key = `${t.name}|${t.typeLine}|${t.power}/${t.toughness}|${t.colors.join("")}|${t.oracleText}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Commanders, and Backgrounds, which only ever join a commander as the second one. */
function isCommander(raw: ScryfallCard): boolean {
  const front = frontTypeLine(raw);
  if (front.includes("Legendary") && (front.includes("Creature") || front.includes("Background"))) return true;
  return /can be your commander/i.test(oracleText(raw));
}

function toCommander(
  raw: ScryfallCard,
  card: Card,
  tagSlugs: Set<string> | null,
  edhrec: EdhrecArchetypeData,
): CommanderSummary {
  const tribes = confirmedTribes(detectTribes(card.oracleText, raw.name.split(" // ")[0]), tagSlugs);
  const themes = detectThemes(card.oracleText);
  if (tribes.length) themes.push("tribal");
  const slug = edhrecSlug(card.name);
  const edhrecDecks = edhrec.totals.get(slug) ?? null;
  const edhrecThemes = edhrec.themes.get(slug) ?? {};
  const pairings = pairingsOf(card);

  return {
    id: card.id,
    name: card.name,
    set: raw.set,
    manaCost: card.manaCost,
    cmc: card.cmc,
    typeLine: card.typeLine,
    colorIdentity: card.colorIdentity,
    complexity: rulesComplexity({ name: card.name, oracleText: card.oracleText, pairings }),
    image: card.image,
    edhrecRank: card.edhrecRank,
    priceUsd: card.priceUsd,
    gameChanger: card.gameChanger,
    themes,
    tribes,
    creatureTypes: creatureTypes(card.typeLine),
    pairings,
    edhrecDecks,
    edhrecThemes,
    archetypes: combineArchetypes({
      tagger: tagSlugs ? archetypesFromTags(tagSlugs) : null,
      text: archetypesFromText(card.oracleText),
      typal: tribes.length > 0 || Boolean(tagSlugs?.has("typal-choose")),
      edhrecThemes,
    }),
  };
}

function writeJson(file: string, data: unknown) {
  writeFileSync(file, JSON.stringify(data));
}

main().catch((err) => {
  console.error("[card-db] failed:", err);
  process.exit(1);
});
