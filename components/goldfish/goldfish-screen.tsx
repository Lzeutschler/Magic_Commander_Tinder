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
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { CardImage } from "@/components/card/card-image";
import { ManaSymbol } from "@/components/card/mana";
import {
  ArrowLeftIcon,
  ArrowUUpLeftIcon,
  CaretDownIcon,
  ChartBarIcon,
  DotsThreeIcon,
  HandIcon,
  HeartIcon,
  KeyboardIcon,
  ManaGlyph,
  ShuffleIcon,
  SidebarSimpleIcon,
  SkipForwardIcon,
  StackIcon,
} from "@/components/icons";
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
import { cn } from "@/lib/utils";
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
        <Link href="/goldfish" className="text-brand underline underline-offset-4">
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
  const [rail, setRail] = useState(true);
  // The last life change floats up from the life total.
  const [lifeChange, setLifeChange] = useState<{ delta: number; id: number } | null>(null);
  // The big preview sits on the side away from the pointer so it never covers the hovered card.
  const pointerX = useRef(0);
  const [previewSide, setPreviewSide] = useState<"left" | "right">("right");
  const [menu, setMenu] = useState<CardMenuState | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [dragging, setDragging] = useState<GameCard | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const look = (mode: LookRequest["mode"], count: number) => {
    const ids = game.zones.library.slice(0, count);
    if (ids.length) setDialog({ kind: "look", request: { mode, ids } });
  };

  const handlers: CardHandlers = {
    onHover: (card) => {
      setHovered(card && !card.faceDown ? card : null);
      if (card) setPreviewSide(pointerX.current > window.innerWidth / 2 ? "left" : "right");
    },
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
  useEffect(() => {
    const track = (e: PointerEvent) => (pointerX.current = e.clientX);
    window.addEventListener("pointermove", track);
    return () => window.removeEventListener("pointermove", track);
  }, []);

  const mana = availableMana(game);
  const tax = commanderTax(game);
  const art = deck.commander.image ? cardImageUrl(deck.commander.image, "art_crop") : null;

  const playing = game.phase === "playing";
  const newGame = () => {
    if (window.confirm("Start a new game with this deck?")) start(deck);
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
      {/* Fixed below the site header so the table fills the screen and the page never scrolls. Card sizes
          follow the viewport height as much as its width, so they stay readable on laptop screens. */}
      <div
        className="fixed inset-x-0 top-14 bottom-0 z-30 flex flex-col overflow-clip bg-background [--bf-base:clamp(84px,min(11vw,18vh),210px)] [--card-w:var(--bf-base)] [--hand-w:clamp(112px,min(11vw,22vh),220px)] [--pile-w:clamp(64px,min(6.4vw,10.4vh),116px)] max-sm:[--hand-w:100px]"
      >
        {art && (
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.06] blur-sm"
            style={{ backgroundImage: `url(${art})` }}
          />
        )}

        {/* Top bar: phones get icons only and a "More" menu, so one row fits and the table keeps its height. */}
        <div className="relative z-10 flex flex-wrap items-center gap-1.5 border-b border-border bg-ink px-3 py-1.5 shadow-[0_1px_0_0_oklch(0_0_0/50%)] max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:[scrollbar-width:none]">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={`/decks/${deck.id}`} aria-label={`Back to ${deck.name}`} />}
            className="max-sm:px-2"
          >
            <ArrowLeftIcon /> <span className="max-w-40 truncate max-sm:hidden">{deck.name}</span>
          </Button>
          <div className="mx-1 h-6 w-px bg-border max-sm:hidden" />
          <BarButton label="Draw" shortcut="D" onClick={() => act((g) => draw(g))} icon={<HandIcon />} disabled={!playing} />
          <BarButton
            label="Untap"
            shortcut="U"
            onClick={() => act(untapAll)}
            icon={<ManaGlyph name="untap" className="text-base" />}
            disabled={!playing}
          />
          <BarButton label="Next turn" shortcut="N" onClick={() => act(nextTurn)} icon={<SkipForwardIcon />} disabled={!playing} primary />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" disabled={!playing} aria-label="Library" className="max-sm:px-2" />}>
              <StackIcon /> <span className="max-sm:hidden">Library</span> <CaretDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
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
          <Button variant="outline" size="sm" onClick={() => setDialog({ kind: "tokens" })} disabled={!playing} className="max-sm:hidden">
            <ManaGlyph name="token" className="text-base" /> Tokens
          </Button>
          <div className="ml-auto flex items-center gap-1.5">
            {!rail && (
              <div className="mr-2 hidden items-center gap-3 text-sm lg:flex">
                <span className="ui-label text-muted-foreground">
                  Turn <span className="numeral text-base text-foreground">{game.turn || "–"}</span>
                </span>
                <span className="flex items-center gap-1 text-brand">
                  <HeartIcon className="size-4" /> <span className="numeral text-base">{game.life}</span>
                </span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setDialog({ kind: "stats" })} className="max-sm:hidden">
              <ChartBarIcon /> Hand stats
            </Button>
            <ShortcutHelp />
            <BarButton label="Undo" shortcut="⌘Z" onClick={undo} icon={<ArrowUUpLeftIcon />} disabled={!canUndo} />
            <Button variant="ghost" size="sm" onClick={newGame} className="max-sm:hidden">
              <ShuffleIcon /> New game
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More" className="sm:hidden" />}>
                <DotsThreeIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setDialog({ kind: "tokens" })} disabled={!playing}>
                  Create tokens…
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialog({ kind: "stats" })}>Hand stats</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={newGame}>New game</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="hidden lg:inline-flex"
                    aria-label={rail ? "Hide side panel" : "Show side panel"}
                    aria-pressed={rail}
                    onClick={() => setRail((open) => !open)}
                  />
                }
              >
                <SidebarSimpleIcon className="-scale-x-100" />
              </TooltipTrigger>
              <TooltipContent>{rail ? "Hide side panel" : "Show side panel"}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Table */}
        <div className="relative flex min-h-0 flex-1 gap-2 px-2 pt-2">
          <aside className="flex w-[calc(var(--pile-w)+10px)] shrink-0 flex-col gap-2.5 overflow-y-auto overflow-x-hidden px-[5px] pt-1 pb-2 [--card-w:var(--pile-w)]">
            <Pile zone="command" game={game} handlers={handlers} badge={tax ? `+${tax}` : undefined} />
            <Pile zone="library" game={game} handlers={handlers} faceDown onClick={() => playing && act((g) => draw(g))} />
            <Pile zone="graveyard" game={game} handlers={handlers} onClick={() => setDialog({ kind: "zone", zone: "graveyard" })} />
            <Pile zone="exile" game={game} handlers={handlers} onClick={() => setDialog({ kind: "zone", zone: "exile" })} />
          </aside>

          <Battlefield game={game} handlers={handlers} />

          {rail && (
            <aside className="hidden w-52 shrink-0 flex-col gap-2 overflow-y-auto pb-2 lg:flex">
              <div className="panel grid grid-cols-2 divide-x divide-border text-center">
                <div className="p-2.5">
                  <div className="ui-label text-xs text-muted-foreground">Turn</div>
                  <div className="numeral mt-1 text-4xl" data-testid="turn">
                    {game.turn || "–"}
                  </div>
                </div>
                <div className="p-2.5">
                  <div className="ui-label flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <HeartIcon className="size-3" /> Life
                  </div>
                  <div className="relative">
                    <div key={game.life} className="numeral mt-1 animate-[brew-pop_0.3s_ease-out] text-4xl text-brand">
                      {game.life}
                    </div>
                    {lifeChange && (
                      <span
                        key={lifeChange.id}
                        className={cn(
                          "numeral pointer-events-none absolute -top-1 right-0 animate-[brew-delta_1.2s_ease-out_both] text-lg motion-reduce:hidden",
                          lifeChange.delta > 0 ? "text-pick" : "text-pass",
                        )}
                        aria-hidden="true"
                      >
                        {lifeChange.delta > 0 ? `+${lifeChange.delta}` : `−${-lifeChange.delta}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-span-2 grid grid-cols-4 gap-1 border-t border-border p-1.5">
                  {[-5, -1, 1, 5].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => {
                        act((g) => changeLife(g, delta));
                        setLifeChange((last) => ({ delta, id: (last?.id ?? 0) + 1 }));
                      }}
                      aria-label={`${delta > 0 ? "Gain" : "Lose"} ${Math.abs(delta)} life`}
                      className="h-10 rounded-sm bg-secondary text-sm font-semibold tabular-nums shadow-sm transition hover:bg-accent active:translate-y-px"
                    >
                      {delta > 0 ? `+${delta}` : `−${-delta}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel space-y-2 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="ui-label text-xs text-muted-foreground">Untapped sources</span>
                  <span className="numeral text-2xl">{mana.total}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {Object.entries(mana.colors).map(([color, count]) => (
                    <span key={color} className="flex items-center gap-1 text-sm tabular-nums">
                      <ManaSymbol symbol={color} /> {count}
                    </span>
                  ))}
                </div>
                {tax > 0 && <p className="text-xs text-muted-foreground">Commander tax: +{tax}</p>}
              </div>

              <div className="panel min-h-0 flex-1 space-y-1 overflow-y-auto p-3 text-xs">
                <div className="ui-label mb-1.5 text-xs text-muted-foreground">Log</div>
                {game.log.slice(0, 14).map((line, i) => (
                  <div key={`${game.log.length}-${i}`} className={i === 0 ? "text-foreground" : "text-muted-foreground"}>
                    {line}
                  </div>
                ))}
              </div>
            </aside>
          )}

          {/* Large preview of the hovered card, floating over the table on the side away from the pointer. */}
          {hovered && !dragging && (
            <div
              className={cn(
                "pointer-events-none absolute top-3 z-40 w-[clamp(240px,min(22vw,48vh),380px)] drop-shadow-[0_18px_28px_oklch(0_0_0/70%)]",
                previewSide === "right" ? "right-3" : "left-3",
              )}
              aria-hidden="true"
            >
              <CardImage card={hovered.card} size="large" key={hovered.instanceId} eager />
            </div>
          )}

          {game.phase !== "playing" && <MulliganOverlay game={game} act={act} />}
        </div>

        <Hand game={game} handlers={handlers} />

        <DragOverlay dropAnimation={null}>
          {dragging && (
            <div className="w-[var(--card-w)] rotate-3 opacity-95 drop-shadow-[0_16px_24px_oklch(0_0_0/70%)]">
              <CardFace card={{ ...dragging, tapped: false }} />
            </div>
          )}
        </DragOverlay>
      </div>

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
      <TooltipTrigger
        render={
          <Button variant={primary ? "default" : "outline"} size="sm" onClick={onClick} disabled={disabled} aria-label={label} className="max-sm:px-2.5" />
        }
      >
        {icon} <span className="max-sm:hidden">{label}</span>
      </TooltipTrigger>
      <TooltipContent>
        {label} <kbd className="ml-1 rounded-xs border border-border bg-ink px-1 font-mono text-[11px]">{shortcut}</kbd>
      </TooltipContent>
    </Tooltip>
  );
}

function ShortcutHelp() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Keyboard shortcuts" className="max-sm:hidden" />}>
        <KeyboardIcon />
      </TooltipTrigger>
      <TooltipContent className="space-y-1 p-3">
        {SHORTCUTS.map(([key, text]) => (
          <div key={key} className="flex justify-between gap-4">
            <kbd className="rounded-xs border border-border bg-ink px-1 font-mono text-[11px]">{key}</kbd>
            <span>{text}</span>
          </div>
        ))}
        <div className="pt-1 opacity-70">Drag cards between zones.</div>
      </TooltipContent>
    </Tooltip>
  );
}
