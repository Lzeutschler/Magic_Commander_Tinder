"use client";

import { ArrowLeft, Download, Layers, List, Minus, Play, Plus, Star, Swords, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { CardHoverPreview } from "@/components/card/card-hover-preview";
import { CardImage } from "@/components/card/card-image";
import { ColorIdentity, ManaCost } from "@/components/card/mana";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { allowsMultipleCopies } from "@/lib/cards/names";
import type { Card } from "@/lib/cards/types";
import { BRACKET_INFO, bracketViolation } from "@/lib/deckbuilder/brackets";
import { CARD_TYPES, expandEntries, primaryType, type CardType } from "@/lib/decks/stats";
import type { Deck, DeckEntry } from "@/lib/decks/types";
import { BRACKETS, type Bracket } from "@/lib/edhrec/types";
import { cn } from "@/lib/utils";
import { useDeckStore, useDecksHydrated } from "@/stores/decks";

import { AddCardSearch } from "./add-card-search";
import { DeckStatsPanel } from "./deck-stats-panel";
import { ExportDialog } from "./export-dialog";

const GROUP_ORDER: CardType[] = [...CARD_TYPES, "Other"];

export function DeckEditor({ deckId }: { deckId: string }) {
  const hydrated = useDecksHydrated();
  const deck = useDeckStore((s) => s.decks[deckId]);
  const hasSession = useDeckStore((s) => Boolean(s.sessions[deckId]));

  if (!hydrated) return null;
  if (!deck) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
        This deck does not exist on this device.
        <Link href="/decks" className="text-gold underline">
          Back to my decks
        </Link>
      </div>
    );
  }
  return <Editor deck={deck} hasSession={hasSession} />;
}

function Editor({ deck, hasSession }: { deck: Deck; hasSession: boolean }) {
  const router = useRouter();
  const updateDeck = useDeckStore((s) => s.updateDeck);
  const deleteDeck = useDeckStore((s) => s.deleteDeck);
  const [view, setView] = useState<"list" | "visual">("list");

  const update = (fn: (deck: Deck) => Deck) => updateDeck(deck.id, fn);

  const addCard = (card: Card) => {
    const existing = deck.entries.find((e) => e.card.id === card.id);
    if (existing && !allowsMultipleCopies(card.name, card.oracleText)) {
      toast.info(`${card.name} is already in the deck`);
      return;
    }
    const violation = bracketViolation(card, expandEntries(deck.entries), deck.bracket);
    if (violation) toast.warning(`${card.name}: ${violation}`);
    update((d) => ({
      ...d,
      entries: existing
        ? d.entries.map((e) => (e.card.id === card.id ? { ...e, quantity: e.quantity + 1 } : e))
        : [...d.entries, { card, quantity: 1 }],
      maybe: d.maybe.filter((m) => m.id !== card.id),
    }));
  };

  const changeQuantity = (entry: DeckEntry, delta: number) =>
    update((d) => ({
      ...d,
      entries: d.entries
        .map((e) => (e.card.id === entry.card.id ? { ...e, quantity: e.quantity + delta } : e))
        .filter((e) => e.quantity > 0),
    }));

  const moveToMaybe = (entry: DeckEntry) =>
    update((d) => ({
      ...d,
      entries: d.entries.filter((e) => e.card.id !== entry.card.id),
      maybe: [...d.maybe, entry.card],
    }));

  const remove = () => {
    if (!window.confirm(`Delete "${deck.name}"? This cannot be undone.`)) return;
    deleteDeck(deck.id);
    router.push("/decks");
  };

  const groups = GROUP_ORDER.map((type) => ({
    type,
    entries: deck.entries
      .filter((e) => primaryType(e.card) === type)
      .sort((a, b) => a.card.cmc - b.card.cmc || a.card.name.localeCompare(b.card.name)),
  })).filter((g) => g.entries.length > 0);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
      <Link href="/decks" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> My decks
      </Link>

      <header className="panel flex flex-col gap-5 p-5 md:flex-row">
        <div className="w-40 shrink-0 self-center md:self-start">
          <CardImage card={deck.commander} flippable />
        </div>
        <div className="flex flex-1 flex-col gap-4">
          <Input
            key={deck.name}
            defaultValue={deck.name}
            aria-label="Deck name"
            onBlur={(e) => {
              const name = e.currentTarget.value.trim();
              if (name && name !== deck.name) update((d) => ({ ...d, name }));
            }}
            className="h-auto border-transparent bg-transparent px-0 font-heading text-2xl font-bold md:text-3xl dark:bg-transparent"
          />
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <ColorIdentity colors={deck.commander.colorIdentity} />
            <span>{deck.commander.name}</span>
            <span>·</span>
            <label className="flex items-center gap-2">
              Bracket
              <select
                value={deck.bracket}
                onChange={(e) => update((d) => ({ ...d, bracket: Number(e.target.value) as Bracket }))}
                className="rounded-md border border-white/10 bg-card px-2 py-1 text-foreground"
              >
                {BRACKETS.map((b) => (
                  <option key={b} value={b}>
                    {b} – {BRACKET_INFO[b].name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-auto flex flex-wrap gap-2">
            <Button nativeButton={false} render={<Link href={`/build/${deck.id}`} />}>
              <Swords /> {hasSession ? "Continue swiping" : "Swipe more cards"}
            </Button>
            <ExportDialog deck={deck}>
              <Button variant="outline">
                <Download /> Export
              </Button>
            </ExportDialog>
            <Button variant="outline" nativeButton={false} render={<Link href={`/goldfish/${deck.id}`} />}>
              <Play /> Goldfish
            </Button>
            <Button variant="ghost" className="text-destructive" onClick={remove}>
              <Trash2 /> Delete
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <div className="flex gap-2">
            <div className="flex-1">
              <AddCardSearch identity={deck.commander.colorIdentity} onAdd={addCard} />
            </div>
            <div className="flex rounded-lg border border-white/10 p-0.5">
              <ViewButton active={view === "list"} onClick={() => setView("list")} label="List view">
                <List className="size-4" />
              </ViewButton>
              <ViewButton active={view === "visual"} onClick={() => setView("visual")} label="Visual view">
                <Layers className="size-4" />
              </ViewButton>
            </div>
          </div>

          {deck.entries.length === 0 && (
            <p className="panel p-6 text-center text-muted-foreground">No cards yet. Swipe some or add them with the search.</p>
          )}

          <div className={cn(view === "list" ? "columns-1 gap-5 md:columns-2" : "space-y-6")}>
            {groups.map((group) => {
              const count = group.entries.reduce((s, e) => s + e.quantity, 0);
              return (
                <section key={group.type} className="mb-5 break-inside-avoid">
                  <h3 className="mb-2 flex items-baseline gap-2 text-sm font-semibold tracking-widest text-muted-foreground uppercase">
                    {group.type === "Other" ? "Other" : `${group.type}s`.replace("Sorcerys", "Sorceries")}
                    <span className="font-sans text-xs">{count}</span>
                  </h3>
                  {view === "list" ? (
                    <ul className="panel divide-y divide-white/5 p-1">
                      {group.entries.map((entry) => (
                        <CardRow
                          key={entry.card.id}
                          entry={entry}
                          onAdd={() => addCard(entry.card)}
                          onRemove={() => changeQuantity(entry, -1)}
                          onMaybe={() => moveToMaybe(entry)}
                        />
                      ))}
                    </ul>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
                      {group.entries.map((entry) => (
                        <button
                          key={entry.card.id}
                          type="button"
                          onClick={() => changeQuantity(entry, -1)}
                          title="Click to remove"
                          className="group relative transition hover:-translate-y-1"
                        >
                          <CardImage card={entry.card} size="normal" />
                          {entry.quantity > 1 && (
                            <span className="absolute top-2 right-2 rounded-full bg-black/80 px-2 py-0.5 text-xs font-bold">
                              ×{entry.quantity}
                            </span>
                          )}
                          <span className="absolute inset-0 grid place-items-center rounded-[4.75%] bg-black/50 opacity-0 transition group-hover:opacity-100">
                            <Minus className="size-8" />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {deck.maybe.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-widest text-maybe uppercase">
                <Star className="size-4" /> Maybe
                <span className="font-sans text-xs">{deck.maybe.length}</span>
              </h3>
              <ul className="panel divide-y divide-white/5 p-1">
                {deck.maybe.map((card) => (
                  <CardHoverPreview key={card.id} card={card}>
                    <li className="flex items-center gap-3 px-3 py-1.5 text-sm">
                      <span className="flex-1 truncate">{card.name}</span>
                      <ManaCost cost={card.manaCost} />
                      <Button size="xs" variant="outline" onClick={() => addCard(card)}>
                        <Plus /> Add
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        aria-label={`Remove ${card.name} from maybe`}
                        onClick={() => update((d) => ({ ...d, maybe: d.maybe.filter((m) => m.id !== card.id) }))}
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  </CardHoverPreview>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside>
          <DeckStatsPanel deck={deck} />
        </aside>
      </div>
    </div>
  );
}

function CardRow({
  entry,
  onAdd,
  onRemove,
  onMaybe,
}: {
  entry: DeckEntry;
  onAdd: () => void;
  onRemove: () => void;
  onMaybe: () => void;
}) {
  const { card, quantity } = entry;
  const multiple = allowsMultipleCopies(card.name, card.oracleText);
  return (
    <CardHoverPreview card={card}>
      <li className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-white/5">
        <span className="w-5 text-right text-muted-foreground tabular-nums">{quantity}</span>
        <span className={cn("flex-1 truncate", card.gameChanger && "text-gold")} title={card.gameChanger ? "Game Changer" : undefined}>
          {card.name}
        </span>
        <ManaCost cost={card.manaCost} className="shrink-0" />
        <span className="flex gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
          {multiple && (
            <Button size="icon-xs" variant="ghost" aria-label={`Add another ${card.name}`} onClick={onAdd}>
              <Plus />
            </Button>
          )}
          <Button size="icon-xs" variant="ghost" aria-label={`Move ${card.name} to maybe`} onClick={onMaybe}>
            <Star />
          </Button>
          <Button size="icon-xs" variant="ghost" aria-label={`Remove ${card.name}`} onClick={onRemove}>
            <Minus />
          </Button>
        </span>
      </li>
    </CardHoverPreview>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn("grid size-9 place-items-center rounded-md text-muted-foreground", active && "bg-white/10 text-foreground")}
    >
      {children}
    </button>
  );
}
