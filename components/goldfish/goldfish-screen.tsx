"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  Hand as HandIcon,
  Heart,
  Keyboard,
  Layers,
  Minus,
  Plus,
  RotateCcw,
  Shuffle,
  SkipForward,
  Sparkles,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { CardImage } from "@/components/card/card-image";
import { ManaSymbol } from "@/components/card/mana";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cardImageUrl } from "@/lib/cards/image";
import type { Deck } from "@/lib/decks/types";
import {
  availableMana,
  changeLife,
  commanderTax,
  draw,
  mill,
  moveCard,
  mulligan,
  nextTurn,
  shuffleLibrary,
  toggleTap,
  untapAll,
  zoneOf,
} from "@/lib/goldfish/game";
import type { GameCard, GameState, ZoneId } from "@/lib/goldfish/types";
import { useDeckStore, useDecksHydrated } from "@/stores/decks";
import { useGameStore } from "@/stores/game";

import { CardMenu, type CardMenuState } from "./card-menu";
import { CardFace, type CardHandlers } from "./game-card";
import { LookDialog, type LookRequest } from "./look-dialog";
import { MulliganOverlay } from "./mulligan-overlay";
import { StatsDialog } from "./stats-dialog";
import { TokenDialog } from "./token-dialog";
import { ZoneBrowser } from "./zone-browser";
import { Battlefield, Hand, Pile } from "./zones";

const X_VALUES = [1, 2, 3, 4, 5, 6, 7];

const SHORTCUTS = [
  ["D", "Draw a card"],
  ["U", "Untap all"],
  ["N", "Next turn (untap + draw)"],
  ["S", "Shuffle library"],
  ["M", "Mulligan (opening hand)"],
  ["⌘/Ctrl Z", "Undo"],
  ["Right-click", "Card actions"],
];

export function GoldfishScreen({ deckId }: { deckId: string }) {
  const hydrated = useDecksHydrated();
  const deck = useDeckStore((s) => s.decks[deckId]);
  const game = useGameStore((s) => (s.deckId === deckId ? s.game : null));
  const start = useGameStore((s) => s.start);

  useEffect(() => {
    if (deck && !game) start(deck);
  }, [deck, game, start]);

  if (!hydrated) return null;
  if (!deck) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
        This deck does not exist on this device.
        <Link href="/goldfish" className="text-gold underline">
          Pick another deck
        </Link>
      </div>
    );
  }
  if (!game) return null;
  return <Table deck={deck} game={game} />;
}

type Dialog =
  | { kind: "look"; request: LookRequest }
  | { kind: "zone"; zone: ZoneId }
  | { kind: "tokens" }
  | { kind: "stats" }
  | null;

function Table({ deck, game }: { deck: Deck; game: GameState }) {
  const act = useGameStore((s) => s.act);
  const undo = useGameStore((s) => s.undo);
  const canUndo = useGameStore((s) => s.past.length > 0);
  const start = useGameStore((s) => s.start);
  const [hovered, setHovered] = useState<GameCard | null>(null);
  const [menu, setMenu] = useState<CardMenuState | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [dragging, setDragging] = useState<GameCard | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const look = (mode: LookRequest["mode"], count: number) => {
    const ids = game.zones.library.slice(0, count);
    if (ids.length) setDialog({ kind: "look", request: { mode, ids } });
  };

  const handlers: CardHandlers = {
    onHover: (card) => card && !card.faceDown && setHovered(card),
    onContextMenu: (card, position) => setMenu({ card, ...position }),
    onClick: (card) => {
      const zone = zoneOf(game, card.instanceId);
      if (zone === "hand" || zone === "command") act((g) => moveCard(g, card.instanceId, "battlefield"));
      else if (zone === "battlefield") act((g) => toggleTap(g, card.instanceId));
    },
  };

  const onDragStart = (event: DragStartEvent) => {
    setMenu(null);
    setDragging(game.cards[String(event.active.id)] ?? null);
  };
  const onDragEnd = (event: DragEndEvent) => {
    setDragging(null);
    const to = event.over?.id as ZoneId | undefined;
    if (to) act((g) => moveCard(g, String(event.active.id), to, { position: "top" }));
  };

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [role=dialog]")) return;
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === "z") undo();
      else if (e.metaKey || e.ctrlKey || e.altKey) return;
      else if (game.phase !== "playing") {
        if (key === "m" && game.phase === "mulligan") act(mulligan);
        else return;
      } else if (key === "d") act((g) => draw(g));
      else if (key === "u") act(untapAll);
      else if (key === "n") act(nextTurn);
      else if (key === "s") act(shuffleLibrary);
      else return;
      e.preventDefault();
    },
    [act, undo, game.phase],
  );
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  const mana = availableMana(game);
  const tax = commanderTax(game);
  const art = deck.commander.image ? cardImageUrl(deck.commander.image, "art_crop") : null;

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
      {/* Fixed below the site header so the table fills the screen and the page never scrolls. */}
      <div className="fixed inset-x-0 top-14 bottom-0 z-30 flex flex-col overflow-hidden bg-background">
        {art && (
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.07] blur-sm"
            style={{ backgroundImage: `url(${art})` }}
          />
        )}

        {/* Top bar */}
        <div className="relative flex flex-wrap items-center gap-2 border-b border-white/5 bg-background/60 px-3 py-2 backdrop-blur">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/decks/${deck.id}`} />}>
            <ArrowLeft /> <span className="max-w-40 truncate">{deck.name}</span>
          </Button>
          <div className="mx-1 h-5 w-px bg-white/10" />
          <BarButton label="Draw" shortcut="D" onClick={() => act((g) => draw(g))} icon={<HandIcon />} disabled={game.phase !== "playing"} />
          <BarButton label="Untap" shortcut="U" onClick={() => act(untapAll)} icon={<RotateCcw />} disabled={game.phase !== "playing"} />
          <BarButton label="Next turn" shortcut="N" onClick={() => act(nextTurn)} icon={<SkipForward />} disabled={game.phase !== "playing"} primary />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" disabled={game.phase !== "playing"} />}>
              <Layers /> Library <ChevronDown />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              {(
                [
                  ["Draw", (n: number) => act((g) => draw(g, n))],
                  ["Scry", (n: number) => look("scry", n)],
                  ["Surveil", (n: number) => look("surveil", n)],
                  ["Look at top", (n: number) => look("reveal", n)],
                  ["Mill", (n: number) => act((g) => mill(g, n))],
                ] as const
              ).map(([label, run]) => (
                <DropdownMenuSub key={label}>
                  <DropdownMenuSubTrigger>{label} X</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {X_VALUES.map((n) => (
                      <DropdownMenuItem key={n} onClick={() => run(n)}>
                        {label} {n}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDialog({ kind: "zone", zone: "library" })}>Search library…</DropdownMenuItem>
              <DropdownMenuItem onClick={() => act(shuffleLibrary)}>Shuffle (S)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => setDialog({ kind: "tokens" })} disabled={game.phase !== "playing"}>
            <Sparkles /> Tokens
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDialog({ kind: "stats" })}>
              <BarChart3 /> Hand stats
            </Button>
            <ShortcutHelp />
            <BarButton label="Undo" shortcut="⌘Z" onClick={undo} icon={<Undo2 />} disabled={!canUndo} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm("Start a new game with this deck?")) start(deck);
              }}
            >
              <Shuffle /> New game
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="relative flex min-h-0 flex-1 gap-3 p-3">
          <aside className="flex w-[calc(var(--card-w)+8px)] shrink-0 flex-col gap-3 overflow-y-auto [--card-w:clamp(64px,6vw,100px)]">
            <Pile zone="command" game={game} handlers={handlers} badge={tax ? `+${tax}` : undefined} />
            <Pile zone="library" game={game} handlers={handlers} faceDown onClick={() => game.phase === "playing" && act((g) => draw(g))} />
            <Pile zone="graveyard" game={game} handlers={handlers} onClick={() => setDialog({ kind: "zone", zone: "graveyard" })} />
            <Pile zone="exile" game={game} handlers={handlers} onClick={() => setDialog({ kind: "zone", zone: "exile" })} />
          </aside>

          <Battlefield game={game} handlers={handlers} />

          <aside className="hidden w-60 shrink-0 flex-col gap-3 overflow-y-auto lg:flex">
            <div className="panel grid grid-cols-2 gap-2 p-3 text-center">
              <div>
                <div className="text-[11px] text-muted-foreground">Turn</div>
                <div className="font-heading text-3xl font-bold" data-testid="turn">
                  {game.turn || "–"}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <Heart className="size-3" /> Life
                </div>
                <div className="font-heading text-3xl font-bold text-gold">{game.life}</div>
                <div className="mt-1 flex justify-center gap-1">
                  {[-5, -1, 1, 5].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => act((g) => changeLife(g, delta))}
                      className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] hover:bg-white/15"
                    >
                      {delta > 0 ? <Plus className="inline size-2.5" /> : <Minus className="inline size-2.5" />}
                      {Math.abs(delta)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel space-y-2 p-3">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Untapped mana sources</span>
                <span className="font-heading text-xl font-bold">{mana.total}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(mana.colors).map(([color, count]) => (
                  <span key={color} className="flex items-center gap-1 text-sm">
                    <ManaSymbol symbol={color} /> {count}
                  </span>
                ))}
              </div>
              {tax > 0 && <p className="text-xs text-muted-foreground">Commander tax: +{tax}</p>}
            </div>

            <div className="mx-auto w-full max-w-60">
              {hovered ? (
                <CardImage card={hovered.card} size="large" flippable key={hovered.instanceId} />
              ) : (
                <div className="card-aspect grid place-items-center rounded-[4.75%] border border-dashed border-white/10 p-4 text-center text-xs text-muted-foreground/60">
                  Hover a card to see it here
                </div>
              )}
            </div>

            <div className="panel space-y-1 p-3 text-xs">
              <div className="mb-1 font-semibold text-muted-foreground">Log</div>
              {game.log.slice(0, 8).map((line, i) => (
                <div key={`${game.log.length}-${i}`} className={i === 0 ? "text-foreground" : "text-muted-foreground"}>
                  {line}
                </div>
              ))}
            </div>
          </aside>

          {game.phase !== "playing" && <MulliganOverlay game={game} act={act} />}
        </div>

        <Hand game={game} handlers={handlers} />
      </div>

      <DragOverlay dropAnimation={null}>
        {dragging && (
          <div className="w-[clamp(84px,8vw,138px)] rotate-3 opacity-90 shadow-2xl">
            <CardFace card={{ ...dragging, tapped: false }} />
          </div>
        )}
      </DragOverlay>

      {menu && <CardMenu menu={menu} game={game} onAction={act} onClose={() => setMenu(null)} />}
      {dialog?.kind === "look" && <LookDialog request={dialog.request} game={game} act={act} onClose={() => setDialog(null)} />}
      {dialog?.kind === "zone" && <ZoneBrowser zone={dialog.zone} game={game} act={act} onClose={() => setDialog(null)} />}
      {dialog?.kind === "tokens" && <TokenDialog act={act} onClose={() => setDialog(null)} />}
      {dialog?.kind === "stats" && <StatsDialog deck={deck} onClose={() => setDialog(null)} />}
    </DndContext>
  );
}

function BarButton({
  label,
  shortcut,
  icon,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  shortcut: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant={primary ? "default" : "outline"} size="sm" onClick={onClick} disabled={disabled} />}>
        {icon} {label}
      </TooltipTrigger>
      <TooltipContent>
        {label} <kbd className="ml-1 opacity-70">{shortcut}</kbd>
      </TooltipContent>
    </Tooltip>
  );
}

function ShortcutHelp() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Keyboard shortcuts" />}>
        <Keyboard />
      </TooltipTrigger>
      <TooltipContent className="space-y-1 p-3">
        {SHORTCUTS.map(([key, text]) => (
          <div key={key} className="flex justify-between gap-4">
            <kbd className="font-mono">{key}</kbd>
            <span>{text}</span>
          </div>
        ))}
        <div className="pt-1 opacity-70">Drag cards between zones.</div>
      </TooltipContent>
    </Tooltip>
  );
}
