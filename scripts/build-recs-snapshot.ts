/**
 * Condenses EDHREC's bulk data (edhrec.com/data/data.tgz: commander, card and how many of the commander's
 * decks play the card) into one small file per commander. The deckbuilder reads these when EDHREC's pages
 * cannot be asked (down, busy or rate limiting us), instead of guessing from card popularity alone.
 *
 * Outputs:
 *   data/recs-snapshot/{slug}.json  deck count, the most played cards and the highest-synergy cards (server only)
 *   data/recs-snapshot/meta.json    build timestamp and when the archive was downloaded
 *
 * Needs data/cards.json from scripts/build-card-db.ts for color identities. The archive is cached in
 * .cache/edhrec-bulk for a week, and the snapshot is skipped while it is younger than a week; pass --force
 * to rebuild. With RECS_SOURCE=off nothing is downloaded and the snapshot is removed. EDHREC's license
 * allows non-commercial use only. A failure leaves the old snapshot (or none) and lets the build go on.
 */
import { spawn, execFile } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import path from "node:path";

import { edhrecSlug, frontFaceName, isBasicLandName, nameKey } from "@/lib/cards/names";
import type { Card } from "@/lib/cards/types";
import { recsSource } from "@/lib/recs/source";
import {
  colorMask,
  condenseSnapshot,
  parseCsvLine,
  type SnapshotCard,
  type SnapshotCommander,
} from "@/lib/recs/snapshot-format";
import { USER_AGENT } from "@/lib/site";

const ROOT = process.cwd();
const ARCHIVE_URL = "https://edhrec.com/data/data.tgz";
const ARCHIVE = path.join(ROOT, ".cache/edhrec-bulk/data.tgz");
const CARDS_FILE = path.join(ROOT, "data/cards.json");
const OUT_DIR = path.join(ROOT, "data/recs-snapshot");
const META_FILE = path.join(OUT_DIR, "meta.json");
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** Bump when the output format changes so stale local snapshots are rebuilt. */
const SCHEMA_VERSION = 1;

async function main() {
  if (recsSource() === "off") {
    rmSync(OUT_DIR, { recursive: true, force: true });
    console.log("[recs-snapshot] EDHREC is off (RECS_SOURCE), no snapshot");
    return;
  }
  if (!process.argv.includes("--force") && isFresh()) {
    console.log("[recs-snapshot] snapshot is fresh, skipping (use --force to rebuild)");
    return;
  }

  const downloadedAt = await downloadArchive();
  const { cards, commanders } = await readArchive(loadCardIndex());
  const files = condenseSnapshot(commanders, cards);

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, file] of files) writeFileSync(path.join(OUT_DIR, `${edhrecSlug(name)}.json`), JSON.stringify(file));
  writeFileSync(META_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), schema: SCHEMA_VERSION, downloadedAt }));
  console.log(`[recs-snapshot] wrote ${files.size} of ${commanders.length} commanders (the rest have too few decks)`);
}

function isFresh(): boolean {
  if (!existsSync(META_FILE)) return false;
  const meta = JSON.parse(readFileSync(META_FILE, "utf8")) as { generatedAt: string; schema: number };
  return meta.schema === SCHEMA_VERSION && Date.now() - new Date(meta.generatedAt).getTime() < MAX_AGE_MS;
}

/** Downloads the archive unless the cached copy is younger than a week; returns when it was downloaded. */
async function downloadArchive(): Promise<string> {
  if (existsSync(ARCHIVE) && Date.now() - statSync(ARCHIVE).mtimeMs < MAX_AGE_MS) return statSync(ARCHIVE).mtime.toISOString();

  console.log("[recs-snapshot] downloading EDHREC bulk data (about 275 MB)");
  mkdirSync(path.dirname(ARCHIVE), { recursive: true });
  const res = await fetch(ARCHIVE_URL, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok || !res.body) throw new Error(`GET ${ARCHIVE_URL} failed: ${res.status}`);
  const partial = `${ARCHIVE}.part`;
  await pipeline(Readable.fromWeb(res.body as import("node:stream/web").ReadableStream), createWriteStream(partial));
  renameSync(partial, ARCHIVE);
  return statSync(ARCHIVE).mtime.toISOString();
}

/** Color identity and commander status of every card in the card database, by name key. */
function loadCardIndex(): Map<string, Card> {
  if (!existsSync(CARDS_FILE)) throw new Error("data/cards.json is missing, run scripts/build-card-db.ts first");
  const index = new Map<string, Card>();
  for (const card of JSON.parse(readFileSync(CARDS_FILE, "utf8")) as Card[]) {
    index.set(nameKey(card.name), card);
    const front = nameKey(frontFaceName(card.name));
    if (!index.has(front)) index.set(front, card);
  }
  return index;
}

/**
 * Streams edhrec.csv out of the archive into per-commander rows of card indexes and counts. Names are
 * matched to the card database, which also merges the data's odd spellings of one card ("OBEKA, BRUTE
 * CHRONOLOGIST", a name wrapped in quotes) into one commander or card.
 */
async function readArchive(index: Map<string, Card>) {
  const { stdout } = await promisify(execFile)("tar", ["-tzf", ARCHIVE]);
  const entry = stdout.split("\n").find((line) => line.endsWith("edhrec.csv"));
  if (!entry) throw new Error("edhrec.csv not found in the archive");

  const lookup = (name: string) => index.get(nameKey(name.replace(/^"+|"+$/g, "")));
  const cards: (SnapshotCard | null)[] = [];
  const cardIds = new Map<string, number>();
  const idByCard = new Map<string, number>();
  const commanders = new Map<string, SnapshotCommander | null>();
  const byCard = new Map<string, SnapshotCommander>();
  const merged = new Set<SnapshotCommander>();
  let unknown = 0;
  const tar = spawn("tar", ["-xzOf", ARCHIVE, entry], { stdio: ["ignore", "pipe", "inherit"] });
  const exited = new Promise<void>((resolve, reject) =>
    tar.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`tar exited with ${code}`)))),
  );

  let header = true;
  for await (const line of createInterface({ input: tar.stdout, crlfDelay: Infinity })) {
    if (header || !line) {
      header = false;
      continue;
    }
    const [commanderName, cardName, count] = line.includes('"') ? parseCsvLine(line) : line.split(",");

    let commander = commanders.get(commanderName);
    if (commander === undefined) {
      const card = lookup(commanderName);
      commander = card ? byCard.get(card.id) ?? null : null;
      if (commander) merged.add(commander);
      else if (card) {
        commander = { name: card.name, mask: colorMask(card.colorIdentity), cards: new Int32Array(256), counts: new Int32Array(256), length: 0 };
        byCard.set(card.id, commander);
      } else unknown++;
      commanders.set(commanderName, commander);
    }
    if (!commander) continue;

    let id = cardIds.get(cardName);
    if (id === undefined) {
      const card = lookup(cardName);
      id = card ? idByCard.get(card.id) : undefined;
      if (id === undefined) {
        id = cards.length;
        cards.push(card ? { name: card.name, mask: colorMask(card.colorIdentity), skip: isBasicLandName(card.name) } : null);
        if (card) idByCard.set(card.id, id);
      }
      cardIds.set(cardName, id);
    }

    if (commander.length === commander.cards.length) {
      commander.cards = grow(commander.cards);
      commander.counts = grow(commander.counts);
    }
    commander.cards[commander.length] = id;
    commander.counts[commander.length] = Number(count);
    commander.length++;
  }
  await exited;

  for (const commander of merged) sumDuplicates(commander);
  console.log(`[recs-snapshot] read ${byCard.size} commanders (${unknown} names not in the card database)`);
  return { cards, commanders: [...byCard.values()] };
}

/** A commander read under two spellings lists some cards twice; add their counts up. */
function sumDuplicates(commander: SnapshotCommander) {
  const sums = new Map<number, number>();
  for (let i = 0; i < commander.length; i++) {
    sums.set(commander.cards[i], (sums.get(commander.cards[i]) ?? 0) + commander.counts[i]);
  }
  commander.cards = Int32Array.from(sums.keys());
  commander.counts = Int32Array.from(sums.values());
  commander.length = sums.size;
}

function grow(array: Int32Array): Int32Array {
  const bigger = new Int32Array(array.length * 2);
  bigger.set(array);
  return bigger;
}

main().catch((err) => {
  console.warn(`[recs-snapshot] skipped: ${(err as Error).message}`);
});
