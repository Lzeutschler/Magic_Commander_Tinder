"use client";

import { useEffect, useRef } from "react";

import {
  addCounter,
  copyAsToken,
  moveCard,
  toggleFaceDown,
  toggleFlip,
  toggleTap,
  zoneOf,
} from "@/lib/goldfish/game";
import type { GameCard, GameState, ZoneId } from "@/lib/goldfish/types";
import { cn } from "@/lib/utils";

export interface CardMenuState {
  card: GameCard;
  x: number;
  y: number;
}

type Action = (game: GameState) => GameState;

interface MenuItem {
  label: string;
  action: Action;
  hint?: string;
}

function menuItems(game: GameState, card: GameCard): MenuItem[][] {
  const id = card.instanceId;
  const zone = zoneOf(game, id);
  const move = (to: ZoneId, label: string, position?: "top" | "bottom"): MenuItem => ({
    label,
    action: (g) => moveCard(g, id, to, { position }),
  });

  const groups: MenuItem[][] = [];
  if (zone === "battlefield") {
    groups.push([
      { label: card.tapped ? "Untap" : "Tap", hint: "click", action: (g) => toggleTap(g, id) },
      { label: "Add +1/+1 counter", action: (g) => addCounter(g, id, "+1/+1", 1) },
      ...(card.counters["+1/+1"] ? [{ label: "Remove +1/+1 counter", action: (g: GameState) => addCounter(g, id, "+1/+1", -1) }] : []),
      { label: "Add counter", action: (g) => addCounter(g, id, "counter", 1) },
      ...(card.counters.counter ? [{ label: "Remove counter", action: (g: GameState) => addCounter(g, id, "counter", -1) }] : []),
    ]);
    groups.push([
      ...(card.card.image?.doubleFaced ? [{ label: "Transform / flip", action: (g: GameState) => toggleFlip(g, id) }] : []),
      { label: card.faceDown ? "Turn face up" : "Turn face down", action: (g) => toggleFaceDown(g, id) },
      { label: "Create a token copy", action: (g) => copyAsToken(g, id) },
    ]);
  }
  if (zone === "hand") {
    groups.push([
      { ...move("battlefield", "Play"), hint: "click" },
      {
        label: "Play face down",
        action: (g) => toggleFaceDown(moveCard(g, id, "battlefield"), id),
      },
    ]);
  }
  if (zone === "command") groups.push([{ ...move("battlefield", "Cast commander"), hint: "click" }]);

  const moves: MenuItem[] = [];
  if (zone !== "battlefield" && zone !== "hand" && zone !== "command") moves.push(move("battlefield", "Put onto battlefield"));
  if (zone !== "hand") moves.push(move("hand", "Return to hand"));
  if (zone !== "graveyard") moves.push(move("graveyard", zone === "hand" ? "Discard" : "Put into graveyard"));
  if (zone !== "exile") moves.push(move("exile", "Exile"));
  moves.push(move("library", "Put on top of library", "top"), move("library", "Put on bottom of library", "bottom"));
  if (card.isCommander && zone !== "command") moves.push(move("command", "Return to command zone"));
  groups.push(moves);
  return groups.filter((g) => g.length > 0);
}

export function CardMenu({
  menu,
  game,
  onAction,
  onClose,
}: {
  menu: CardMenuState;
  game: GameState;
  onAction: (action: Action) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof PointerEvent && ref.current?.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [onClose]);

  const groups = menuItems(game, menu.card);
  const left = Math.min(menu.x, window.innerWidth - 230);
  const top = Math.min(menu.y, window.innerHeight - 40 - groups.flat().length * 30);

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 w-56 rounded-xl border border-white/10 bg-popover/95 p-1 text-sm shadow-2xl backdrop-blur"
      style={{ left, top: Math.max(8, top) }}
    >
      <div className="truncate px-2 py-1.5 text-xs font-semibold text-muted-foreground">
        {menu.card.faceDown ? "Face-down card" : menu.card.card.name}
      </div>
      {groups.map((group, i) => (
        <div key={i} className={cn(i > 0 && "mt-1 border-t border-white/10 pt-1")}>
          {group.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-white/10"
              onClick={() => {
                onAction(item.action);
                onClose();
              }}
            >
              {item.label}
              {item.hint && <span className="text-[10px] text-muted-foreground">{item.hint}</span>}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
