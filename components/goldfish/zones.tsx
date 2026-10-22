"use client";

import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence } from "motion/react";

import { CardBack } from "@/components/card/card-back";
import { isLand } from "@/lib/cards/mana";
import type { GameCard, GameState, ZoneId } from "@/lib/goldfish/types";
import { ZONE_LABELS } from "@/lib/goldfish/types";
import { cn } from "@/lib/utils";

import { GameCardView, type CardHandlers } from "./game-card";

function useZoneDrop(zone: ZoneId) {
  return useDroppable({ id: zone });
}

export function Battlefield({ game, handlers }: { game: GameState; handlers: CardHandlers }) {
  const { setNodeRef, isOver } = useZoneDrop("battlefield");
  const cards = game.zones.battlefield.map((id) => game.cards[id]);
  const lands = cards.filter((c) => isLand(c.card) && !c.faceDown);
  const permanents = cards.filter((c) => !lands.includes(c));

  return (
    <div
      ref={setNodeRef}
      data-zone="battlefield"
      className={cn(
        "relative flex min-h-0 flex-1 flex-col gap-3 overflow-auto rounded-2xl border border-white/10 p-3 transition [--card-w:clamp(64px,6.2vw,108px)]",
        isOver && "border-gold/60 shadow-[inset_0_0_40px] shadow-gold/15",
      )}
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, oklch(0.3 0.05 250 / 70%), oklch(0.17 0.03 265 / 85%) 70%), repeating-linear-gradient(45deg, oklch(1 0 0 / 2%) 0 2px, transparent 2px 14px)",
      }}
    >
      {cards.length === 0 && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted-foreground/60">
          Drag cards here or click a card in your hand to play it
        </div>
      )}
      <Row cards={permanents} handlers={handlers} className="flex-1" />
      <Row cards={lands} handlers={handlers} />
    </div>
  );
}

function Row({ cards, handlers, className }: { cards: GameCard[]; handlers: CardHandlers; className?: string }) {
  return (
    <div className={cn("flex min-h-[calc(var(--card-w)*1.4)] flex-wrap content-start items-start gap-2", className)}>
      <AnimatePresence initial={false}>
        {cards.map((card) => (
          <GameCardView key={card.instanceId} card={card} handlers={handlers} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Hand({ game, handlers }: { game: GameState; handlers: CardHandlers }) {
  const { setNodeRef, isOver } = useZoneDrop("hand");
  const cards = game.zones.hand.map((id) => game.cards[id]);
  const mid = (cards.length - 1) / 2;
  const overlap = cards.length > 9 ? 0.55 : cards.length > 6 ? 0.4 : 0.2;

  return (
    <div
      ref={setNodeRef}
      data-zone="hand"
      className={cn(
        "relative flex h-[calc(var(--card-w)*1.1)] items-start justify-center rounded-t-2xl pt-3 transition [--card-w:clamp(84px,8vw,138px)]",
        isOver && "bg-gold/5",
      )}
    >
      {cards.length === 0 && <span className="self-center text-xs text-muted-foreground/60">Hand is empty</span>}
      {cards.map((card, i) => (
        <div
          key={card.instanceId}
          className="transition-transform duration-200 hover:z-30 hover:-translate-y-[35%] hover:scale-125"
          style={{
            marginLeft: i === 0 ? 0 : `calc(var(--card-w) * -${overlap})`,
            transform: `rotate(${(i - mid) * 2.5}deg) translateY(${Math.abs(i - mid) ** 1.6 * 2}px)`,
            zIndex: i,
          }}
        >
          <GameCardView card={card} handlers={handlers} />
        </div>
      ))}
      <span className="absolute top-1 right-3 text-xs text-muted-foreground">{cards.length} in hand</span>
    </div>
  );
}

/** A stacked zone (library, graveyard, exile, command) that shows its top card and a count. */
export function Pile({
  zone,
  game,
  onClick,
  handlers,
  faceDown,
  badge,
  children,
}: {
  zone: ZoneId;
  game: GameState;
  onClick?: () => void;
  handlers: CardHandlers;
  faceDown?: boolean;
  badge?: string;
  children?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useZoneDrop(zone);
  const ids = game.zones[zone];
  const topId = zone === "library" ? ids[0] : ids.at(-1);
  const top = topId ? game.cards[topId] : null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{ZONE_LABELS[zone]}</span>
        <span className="tabular-nums">{ids.length}</span>
      </div>
      <div
        ref={setNodeRef}
        data-zone={zone}
        className={cn(
          "relative rounded-[6%] transition",
          isOver && "ring-2 ring-gold ring-offset-2 ring-offset-background",
        )}
      >
        {top && !faceDown ? (
          <GameCardView card={top} handlers={{ ...handlers, onClick: onClick ? () => onClick() : handlers.onClick }} />
        ) : (
          <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className="block w-[var(--card-w)] disabled:cursor-default"
            aria-label={ZONE_LABELS[zone]}
            onMouseEnter={() => handlers.onHover?.(null)}
          >
            {top ? (
              <div className="relative">
                {ids.length > 1 && <CardBack className="absolute inset-0 translate-x-1 translate-y-1 opacity-60" />}
                <CardBack className="relative" />
              </div>
            ) : (
              <div className="card-aspect grid place-items-center rounded-[4.75%] border border-dashed border-white/15 text-[10px] text-muted-foreground/60">
                empty
              </div>
            )}
          </button>
        )}
        {badge && (
          <span className="pointer-events-none absolute -top-2 -right-2 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
