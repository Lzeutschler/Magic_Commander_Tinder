"use client";

import { Loader2, Plus, Search } from "lucide-react";
import { useDeferredValue, useState } from "react";

import { CardHoverPreview } from "@/components/card/card-hover-preview";
import { ManaCost } from "@/components/card/mana";
import { Input } from "@/components/ui/input";
import type { Card, Color } from "@/lib/cards/types";
import { useCardSearch } from "@/lib/data/client";

/** Search box that only offers cards within the commander's color identity. */
export function AddCardSearch({ identity, onAdd }: { identity: readonly Color[]; onAdd: (card: Card) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const deferred = useDeferredValue(query);
  const search = useCardSearch(deferred, identity.join(""));
  const results = query.trim().length >= 2 ? (search.data?.cards ?? []) : [];

  const add = (card: Card) => {
    onAdd(card);
    setQuery("");
  };

  return (
    <div className="relative" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) add(results[0]);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Add a card…"
        className="h-10 pl-9"
      />
      {search.isFetching && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      {open && results.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-auto rounded-xl border border-white/10 bg-popover p-1 shadow-2xl">
          {results.map((card) => (
            <CardHoverPreview key={card.id} card={card}>
              <li>
                <button
                  type="button"
                  onClick={() => add(card)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/5"
                >
                  <Plus className="size-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{card.name}</span>
                  <ManaCost cost={card.manaCost} />
                </button>
              </li>
            </CardHoverPreview>
          ))}
        </ul>
      )}
    </div>
  );
}
