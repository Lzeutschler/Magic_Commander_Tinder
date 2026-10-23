import "server-only";

import { cacheLife } from "next/cache";

/**
 * A Scryfall card image as a data URL for `ImageResponse`, which would fetch it with a generic
 * User-Agent that Scryfall rejects. Null when Scryfall cannot be reached, so images leave the card out.
 */
export async function scryfallImageDataUrl(url: string): Promise<string | null> {
  try {
    return await fetchDataUrl(url);
  } catch {
    return null;
  }
}

/** Image URLs carry a version, so a fetched image never changes; failures throw and are not cached. */
async function fetchDataUrl(url: string): Promise<string> {
  "use cache";
  cacheLife("max");

  const res = await fetch(url, {
    headers: { "User-Agent": "Brewmance/0.1", Accept: "image/*" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`Scryfall image: HTTP ${res.status}`);
  return `data:${res.headers.get("content-type") ?? "image/jpeg"};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
}
