"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { CardImage } from "@/components/card/card-image";
import { ManaSymbol } from "@/components/card/mana";
import { MagnifyingGlassIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { COLORS } from "@/lib/cards/colors";
import { nameKey } from "@/lib/cards/names";
import { isBackground } from "@/lib/cards/pairing";
import type { Color, CommanderSummary } from "@/lib/cards/types";
import { useCommanders } from "@/lib/data/client";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 30;

type ColorFilter = Color | "C";

/** Lower-case, accent- and punctuation-free text so "krenko mob" matches "Krenko, Mob Boss". */
function searchText(text: string): string {
  return nameKey(text).replace(/[^a-z0-9]+/g, " ").trim();
}

function matchesColors(commander: CommanderSummary, selected: ColorFilter[]): boolean {
  if (!selected.length) return true;
  if (selected.includes("C")) return commander.colorIdentity.length === 0;
  return selected.length === commander.colorIdentity.length && selected.every((c) => commander.colorIdentity.includes(c as Color));
}

export function CommanderPicker({
  selected,
  onSelect,
}: {
  selected: CommanderSummary | null;
  onSelect: (commander: CommanderSummary) => void;
}) {
  const { data: commanders, isLoading, error } = useCommanders();
  const [query, setQuery] = useState("");
  const [colors, setColors] = useState<ColorFilter[]>([]);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const tokens = searchText(deferredQuery).split(" ").filter(Boolean);
    return (commanders ?? []).filter((c) => {
      // Backgrounds join a commander that chooses one, from its setup.
      if (isBackground(c) || !matchesColors(c, colors)) return false;
      const haystack = searchText(`${c.name} ${c.typeLine}`);
      return tokens.every((t) => haystack.includes(t));
    });
  }, [commanders, deferredQuery, colors]);

  const toggleColor = (color: ColorFilter) => {
    setLimit(PAGE_SIZE);
    setColors((current) => {
      if (color === "C") return current.includes("C") ? [] : ["C"];
      const withoutColorless = current.filter((c) => c !== "C");
      return withoutColorless.includes(color) ? withoutColorless.filter((c) => c !== color) : [...withoutColorless, color];
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE_SIZE);
            }}
            placeholder="Search commanders or creature types…"
            className="h-11 pl-9"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Color identity filter">
          {[...COLORS, "C" as const].map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => toggleColor(color)}
              aria-pressed={colors.includes(color)}
              aria-label={`Filter by `}
              className={cn(
                "grid size-10 place-items-center rounded-md border border-transparent opacity-45 grayscale-[60%] transition hover:bg-accent hover:opacity-90",
                colors.includes(color) && "border-brand bg-brand/12 opacity-100 grayscale-0",
              )}
            >
              <ManaSymbol symbol={color} className="size-6" />
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {colors.length ? "Exact color identity · " : ""}
        {commanders ? `${results.length.toLocaleString()} commanders, most played first` : "Loading commanders…"}
      </p>

      {error && <p className="text-sm text-destructive">Could not load commanders: {error.message}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {isLoading &&
          Array.from({ length: 12 }, (_, i) => <Skeleton key={i} className="card-aspect rounded-[4.75%]" />)}
        {results.slice(0, limit).map((commander) => (
          <button
            key={commander.id}
            type="button"
            onClick={() => onSelect(commander)}
            className={cn(
              "rounded-[5%] text-left transition duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              selected?.id === commander.id && "ring-3 ring-brand ring-offset-2 ring-offset-background",
            )}
            title={commander.name}
          >
            <CardImage card={commander} size="normal" />
          </button>
        ))}
      </div>

      {results.length > limit && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setLimit((l) => l + PAGE_SIZE * 2)}>
            Show more
          </Button>
        </div>
      )}
    </div>
  );
}
