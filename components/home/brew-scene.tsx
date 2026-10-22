import { ManaSymbol } from "@/components/card/mana";
import { Cauldron, HeartShape as Heart } from "@/components/cauldron";
import { cardImageUrl } from "@/lib/cards/image";
import type { CardImage } from "@/lib/cards/types";
import { cn } from "@/lib/utils";

/** Commanders that take turns rising from the brew; well known across the Commander crowd. */
const COMMANDERS: { name: string; image: CardImage }[] = [
  { name: "Atraxa, Praetors' Voice", image: { key: "d/0/d0d33d52-3d28-4635-b985-51e126289259", version: "1783930136", doubleFaced: false } },
  { name: "The Ur-Dragon", image: { key: "1/0/10d42b35-844f-4a64-9981-c6118d45e826", version: "1783915607", doubleFaced: false } },
  { name: "Edgar Markov", image: { key: "a/5/a577ba08-0aa8-45be-aa83-d5078770127c", version: "1783908078", doubleFaced: false } },
];

/** The five colors bubble up from the cauldron. `x`/`drift` in em; `rest` is where they sit without motion. */
const PIPS = [
  { symbol: "W", x: "-5.5em", drift: "-3em", rest: "-17em", delay: "0s" },
  { symbol: "U", x: "-2em", drift: "-1.5em", rest: "-21em", delay: "1.4s" },
  { symbol: "B", x: "1.5em", drift: "2em", rest: "-23em", delay: "2.8s" },
  { symbol: "R", x: "5em", drift: "3.5em", rest: "-18em", delay: "4.2s" },
  { symbol: "G", x: "0em", drift: "-4.5em", rest: "-12em", delay: "5.6s" },
];

const HEARTS = [
  { x: "-8em", drift: "-2em", delay: "1s", size: "1.6em" },
  { x: "7em", drift: "2.5em", delay: "3.6s", size: "1.2em" },
  { x: "-1em", drift: "1em", delay: "5.2s", size: "1.4em" },
];


/**
 * The home page illustration: a bubbling cauldron. Commanders rise from the brew one after another
 * and get swiped right with a heart, while the five mana colors and a few hearts drift up as steam.
 * Pure CSS animation (keyframes `brew-*` in globals.css); with reduced motion it rests as a still life.
 * Everything is sized in em, so the scene scales with its font size.
 */
export function BrewScene({ className }: { className?: string }) {
  return (
    <div className={cn("brew-scene relative h-[40em] w-[38em] select-none", className)} aria-hidden="true">
      <Cauldron className="absolute bottom-0 left-1/2 -translate-x-1/2">
        {/* Commanders rising from the brew and being swiped right. */}
        {COMMANDERS.map((commander, i) => (
          <div
            key={commander.name}
            className={cn(
              "absolute bottom-[13em] left-1/2 w-[15em] animate-[brew-card_12s_ease-in-out_infinite_both]",
              i > 0 && "motion-reduce:hidden",
            )}
            style={{ animationDelay: `${i * 4}s`, transform: "translate(-50%, -7em) rotate(-3deg)" }}
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- Scryfall serves pre-sized images */}
              <img
                src={cardImageUrl(commander.image, "normal")}
                alt=""
                draggable={false}
                className="card-aspect w-full rounded-[4.75%] shadow-xl ring-1 ring-black/60"
              />
              <span
                className="absolute -top-[1.2em] -right-[1.2em] grid size-[4.2em] animate-[brew-stamp_12s_ease-out_infinite_both] place-items-center rounded-full bg-[var(--heart)] shadow-lg ring-[0.3em] ring-ink"
                style={{ animationDelay: `${i * 4}s` }}
              >
                <Heart className="w-[2.2em]" fill="#0b0e13" />
              </span>
            </div>
          </div>
        ))}
      </Cauldron>

      {/* Mana colors and hearts drifting up like steam. */}
      {PIPS.map((pip) => (
        <span
          key={pip.symbol}
          className="absolute bottom-[14em] z-20 size-[2.8em] animate-[brew-float_7s_ease-in-out_infinite_both] rounded-full drop-shadow-[0_0.3em_0.4em_rgb(0_0_0/45%)]"
          style={
            {
              left: `calc(50% - 1.4em + ${pip.x})`,
              animationDelay: pip.delay,
              "--drift": pip.drift,
              transform: `translate(${pip.drift}, ${pip.rest})`,
            } as React.CSSProperties
          }
        >
          <ManaSymbol symbol={pip.symbol} className="size-full" />
        </span>
      ))}
      {HEARTS.map((heart) => (
        <Heart
          key={heart.x}
          className="absolute bottom-[15em] z-20 animate-[brew-float_6s_ease-in-out_infinite_both] motion-reduce:hidden"
          style={
            {
              left: `calc(50% + ${heart.x})`,
              width: heart.size,
              animationDelay: heart.delay,
              "--drift": heart.drift,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
