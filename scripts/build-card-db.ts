/**
 * Builds the card database from Scryfall bulk data.
 *
 * Outputs:
 *   data/cards.json            every Commander-legal card (server only)
 *   data/tokens.json           token cards for the goldfish sandbox (server only)
 *   public/data/commanders.json every legal commander with themes and tribes (client)
 *   data/meta.json             build timestamp and source files
 *
 * Skips work when the data is younger than a week; pass --force to rebuild.
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
import type { Card, CardImage, CommanderSummary, PartnerKind, Role, TokenCard } from "@/lib/cards/types";
import { ROLES, ROLE_TAGS, rolesFromText } from "@/lib/tagging/roles";
import { detectThemes } from "@/lib/tagging/themes";
import { creatureTypes, detectTribes } from "@/lib/tagging/tribes";

const ROOT = process.cwd();
const CACHE_DIR = path.join(ROOT, ".cache/scryfall");
const DATA_DIR = path.join(ROOT, "data");
const PUBLIC_DATA_DIR = path.join(ROOT, "public/data");
const META_FILE = path.join(DATA_DIR, "meta.json");
const OUTPUTS = [
  path.join(DATA_DIR, "cards.json"),
  path.join(DATA_DIR, "tokens.json"),
  path.join(PUBLIC_DATA_DIR, "commanders.json"),
];
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const SCRYFALL_HEADERS = { "User-Agent": "CommanderTinder/0.1", Accept: "application/json" };

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

  const [cardsFile, tagsFile] = await Promise.all([
    download(cardsSource.jsonl_download_uri),
    download(tagsSource.jsonl_download_uri),
  ]);

  console.log("[card-db] reading oracle tags");
  const rolesByOracleId = await buildRoleIndex(tagsFile);

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
    if (isCommander(raw)) commanders.push(toCommander(raw, card));
  }

  cards.sort((a, b) => a.name.localeCompare(b.name));
  commanders.sort((a, b) => (a.edhrecRank ?? Infinity) - (b.edhrecRank ?? Infinity));

  writeJson(path.join(DATA_DIR, "cards.json"), cards);
  writeJson(path.join(DATA_DIR, "tokens.json"), dedupeTokens(tokens));
  writeJson(path.join(PUBLIC_DATA_DIR, "commanders.json"), commanders);
  writeJson(META_FILE, {
    generatedAt: new Date().toISOString(),
    scryfallUpdatedAt: cardsSource.updated_at,
    cards: cards.length,
    commanders: commanders.length,
    tokens: tokens.length,
  });

  console.log(`[card-db] ${cards.length} cards, ${commanders.length} commanders, ${tokens.length} tokens`);
}

function isFresh(): boolean {
  if (!existsSync(META_FILE) || OUTPUTS.some((f) => !existsSync(f))) return false;
  const meta = JSON.parse(readFileSync(META_FILE, "utf8")) as { generatedAt: string };
  return Date.now() - new Date(meta.generatedAt).getTime() < MAX_AGE_MS;
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
async function buildRoleIndex(tagsFile: string): Promise<Map<string, Set<Role>>> {
  const tags: ScryfallTag[] = [];
  for await (const tag of readJsonLines<ScryfallTag>(tagsFile)) tags.push(tag);
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
    const { include, exclude = [] } = ROLE_TAGS[role];
    const excluded = descendants(exclude);
    for (const tagId of descendants(include)) {
      if (excluded.has(tagId)) continue;
      for (const { oracle_id } of byId.get(tagId)!.taggings) {
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
  let roles = tagged ? [...tagged] : rolesFromText(text, isLand);
  // Mana-producing lands are tagged as ramp by Tagger, but they belong to the land count.
  if (isLand) roles = roles.filter((r) => r !== "ramp");
  // A sweeper is not spot removal, and Armageddon is neither: count each card in one slot.
  if (roles.includes("mld")) roles = roles.filter((r) => r !== "removal" && r !== "boardwipe");
  if (roles.includes("boardwipe")) roles = roles.filter((r) => r !== "removal");

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

function isCommander(raw: ScryfallCard): boolean {
  const front = frontTypeLine(raw);
  if (front.includes("Legendary") && front.includes("Creature")) return true;
  return /can be your commander/i.test(oracleText(raw));
}

function partnerKind(raw: ScryfallCard): PartnerKind | null {
  const keywords = raw.keywords ?? [];
  const text = oracleText(raw);
  if (keywords.includes("Partner with")) return "partner-with";
  if (keywords.includes("Partner")) return "partner";
  if (keywords.includes("Friends forever")) return "friends-forever";
  if (keywords.includes("Doctor's companion")) return "doctors-companion";
  if (/choose a background/i.test(text)) return "background";
  return null;
}

function toCommander(raw: ScryfallCard, card: Card): CommanderSummary {
  const tribes = detectTribes(card.oracleText, raw.name.split(" // ")[0]);
  const themes = detectThemes(card.oracleText);
  if (tribes.length) themes.push("tribal");

  return {
    id: card.id,
    name: card.name,
    slug: edhrecSlug(card.name),
    manaCost: card.manaCost,
    cmc: card.cmc,
    typeLine: card.typeLine,
    oracleText: card.oracleText,
    colorIdentity: card.colorIdentity,
    image: card.image,
    edhrecRank: card.edhrecRank,
    priceUsd: card.priceUsd,
    gameChanger: card.gameChanger,
    themes,
    tribes,
    creatureTypes: creatureTypes(card.typeLine),
    partner: partnerKind(raw),
  };
}

function writeJson(file: string, data: unknown) {
  writeFileSync(file, JSON.stringify(data));
}

main().catch((err) => {
  console.error("[card-db] failed:", err);
  process.exit(1);
});
