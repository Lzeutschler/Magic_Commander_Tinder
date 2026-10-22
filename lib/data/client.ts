"use client";

import { useQuery } from "@tanstack/react-query";

import type { Card, CommanderSummary } from "@/lib/cards/types";
import type { CandidatePool, CommanderInsights } from "@/lib/deckbuilder/types";
import type { Bracket } from "@/lib/edhrec/types";

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function useCommanders() {
  return useQuery({
    queryKey: ["commanders"],
    queryFn: () => getJson<CommanderSummary[]>("/data/commanders.json"),
    staleTime: Infinity,
  });
}

export function useCommanderInsights(name: string | null) {
  return useQuery({
    queryKey: ["commander-insights", name],
    queryFn: () => getJson<CommanderInsights>(`/api/commander-insights?commander=${encodeURIComponent(name!)}`),
    enabled: Boolean(name),
  });
}

export function fetchCandidatePool(commander: string, bracket: Bracket, theme: string | null) {
  const params = new URLSearchParams({ commander, bracket: String(bracket) });
  if (theme) params.set("theme", theme);
  return getJson<CandidatePool>(`/api/candidates?${params}`);
}

export function useCardSearch(query: string, identity: string | null) {
  return useQuery({
    queryKey: ["card-search", query, identity],
    queryFn: () => {
      const params = new URLSearchParams({ q: query });
      if (identity !== null) params.set("identity", identity);
      return getJson<{ cards: Card[] }>(`/api/cards/search?${params}`);
    },
    enabled: query.trim().length >= 2,
    placeholderData: (previous) => previous,
  });
}

export function resolveCardNames(names: string[]) {
  return getJson<{ cards: Record<string, Card>; missing: string[] }>("/api/cards/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ names }),
  });
}
