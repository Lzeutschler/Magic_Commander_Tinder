"use client";

import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";

import { CardImage } from "@/components/card/card-image";
import { MagnifyingGlassIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { TokenCard } from "@/lib/cards/types";
import { createTokens } from "@/lib/goldfish/game";
import type { GameState, PlayCard } from "@/lib/goldfish/types";
import { cn } from "@/lib/utils";

function tokenToPlayCard(token: TokenCard): PlayCard {
  return {
    id: token.id,
    name: token.name,
    manaCost: "",
    cmc: 0,
    typeLine: token.typeLine,
    oracleText: token.oracleText,
    image: token.image,
    producedMana: /add one mana of any color/i.test(token.oracleText) ? ["W", "U", "B", "R", "G"] : [],
  };
}

export function TokenDialog({
  act,
  onClose,
}: {
  act: (fn: (g: GameState) => GameState) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(1);
  const [custom, setCustom] = useState({ name: "", power: "1", toughness: "1" });
  const deferred = useDeferredValue(query);
  const tokens = useQuery({
    queryKey: ["tokens", deferred],
    queryFn: async () => {
      const res = await fetch(`/api/tokens?q=${encodeURIComponent(deferred)}`);
      return ((await res.json()) as { tokens: TokenCard[] }).tokens;
    },
    placeholderData: (previous) => previous,
  });

  const create = (card: PlayCard) => {
    act((g) => createTokens(g, card, count));
    onClose();
  };

  const createCustom = () => {
    const name = custom.name.trim() || "Creature";
    create({
      id: `custom-${name}`,
      name,
      manaCost: "",
      cmc: 0,
      typeLine: `Token Creature — ${name}`,
      oracleText: `${custom.power}/${custom.toughness}`,
      image: null,
      producedMana: [],
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create tokens</DialogTitle>
          <DialogDescription>Pick a token or make your own creature token.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-48 flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Treasure, Goblin, Zombie…" className="pl-9" autoFocus />
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="eyebrow mr-1 text-muted-foreground">Amount</span>
            {[1, 2, 3, 5, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                className={cn("size-10 rounded-md border border-border bg-card font-semibold tabular-nums shadow-sm hover:bg-accent", count === n && "border-ember bg-ember/12 hover:bg-ember/12")}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-4">
          {(tokens.data ?? []).map((token) => (
            <button
              key={token.id}
              type="button"
              onClick={() => create(tokenToPlayCard(token))}
              className="space-y-1 text-left transition hover:-translate-y-1"
            >
              <CardImage card={{ ...token, manaCost: "" }} size="normal" />
              <div className="truncate text-xs text-muted-foreground">
                {token.name} {token.power !== null && `${token.power}/${token.toughness}`}
              </div>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2 border-t border-border pt-3">
          <label className="flex-1 space-y-1 text-xs text-muted-foreground">
            Custom token
            <Input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} placeholder="Name, e.g. Dragon" />
          </label>
          <Input className="w-14" aria-label="Power" value={custom.power} onChange={(e) => setCustom({ ...custom, power: e.target.value })} />
          <span className="pb-2 text-muted-foreground">/</span>
          <Input className="w-14" aria-label="Toughness" value={custom.toughness} onChange={(e) => setCustom({ ...custom, toughness: e.target.value })} />
          <Button onClick={createCustom}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
