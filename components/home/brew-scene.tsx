import { ManaSymbol } from "@/components/card/mana";
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

const HEART_PATH =
  "M16 10.2c-.3 0-4.8-2.9-4.8-6.1 0-1.6 1.2-2.8 2.7-2.8.9 0 1.7.5 2.1 1.3.4-.8 1.2-1.3 2.1-1.3 1.5 0 2.7 1.2 2.7 2.8 0 3.2-4.5 6.1-4.8 6.1Z";

function Heart({ className, fill = "var(--heart)", style }: { className?: string; fill?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="10.8 1 10.4 9.6" className={className} style={style} aria-hidden="true">
      <path d={HEART_PATH} fill={fill} />
    </svg>
  );
}

/**
 * The home page illustration: a bubbling cauldron. Commanders rise from the brew one after another
 * and get swiped right with a heart, while the five mana colors and a few hearts drift up as steam.
 * Pure CSS animation (keyframes `brew-*` in globals.css); with reduced motion it rests as a still life.
 * Everything is sized in em, so the scene scales with its font size.
 */
export function BrewScene({ className }: { className?: string }) {
  return (
    <div className={cn("brew-scene relative h-[40em] w-[38em] select-none", className)} aria-hidden="true">
      {/* Glow of the brew. */}
      <div className="absolute bottom-[6em] left-1/2 h-[22em] w-[30em] -translate-x-1/2 animate-[brew-glow_4s_ease-in-out_infinite] rounded-full bg-[radial-gradient(closest-side,rgb(142_162_255/35%),transparent)]" />

      {/* Back of the cauldron: the dark inside and the surface of the brew. */}
      <svg viewBox="0 0 260 180" className="absolute bottom-0 left-1/2 w-[26em] -translate-x-1/2 animate-[brew-bob_4s_ease-in-out_infinite]">
        <defs>
          <radialGradient id="brew-liquid" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#c9d3ff" />
            <stop offset="45%" stopColor="#8ea2ff" />
            <stop offset="100%" stopColor="#4553a8" />
          </radialGradient>
        </defs>
        <ellipse cx="130" cy="42" rx="106" ry="23" fill="#0b0e13" />
        <ellipse
          cx="130"
          cy="46"
          rx="96"
          ry="16"
          fill="url(#brew-liquid)"
          className="origin-center animate-[brew-wobble_3.2s_ease-in-out_infinite] [transform-box:fill-box]"
        />
        {[
          { cx: 92, r: 5, delay: "0s" },
          { cx: 128, r: 7, delay: "0.8s" },
          { cx: 168, r: 4.5, delay: "1.5s" },
          { cx: 110, r: 3.5, delay: "2.1s" },
          { cx: 150, r: 5.5, delay: "2.7s" },
        ].map((bubble) => (
          <circle
            key={bubble.cx}
            cx={bubble.cx}
            cy="48"
            r={bubble.r}
            fill="#dfe5ff"
            className="origin-center animate-[brew-bubble_2.6s_ease-out_infinite_both] opacity-0 [transform-box:fill-box] motion-reduce:opacity-60"
            style={{ animationDelay: bubble.delay }}
          />
        ))}
        <path d="M24 42 A106 23 0 0 1 236 42" fill="none" stroke="#a6b6ff" strokeWidth="9" strokeLinecap="round" />
      </svg>

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

      {/* Front of the cauldron, in front of the cards so they seem to come out of the brew. */}
      <svg viewBox="0 0 260 180" className="absolute bottom-0 left-1/2 z-10 w-[26em] -translate-x-1/2 animate-[brew-bob_4s_ease-in-out_infinite] drop-shadow-[0_1.2em_1.4em_rgb(0_0_0/55%)]">
        <defs>
          <linearGradient id="brew-pot" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a6b6ff" />
            <stop offset="55%" stopColor="#7186e6" />
            <stop offset="100%" stopColor="#3b478f" />
          </linearGradient>
        </defs>
        <path d="M58 150 46 178h20l10-22Z" fill="#2e3878" />
        <path d="M202 150l12 28h-20l-10-22Z" fill="#2e3878" />
        <path d="M24 44 A106 23 0 0 0 236 44 C262 74 250 164 130 166 C10 164 -2 74 24 44Z" fill="url(#brew-pot)" />
        <ellipse cx="78" cy="96" rx="16" ry="30" fill="#ffffff" opacity="0.12" transform="rotate(-18 78 96)" />
        <path d={HEART_PATH} transform="translate(34 70) scale(6)" fill="#0b0e13" opacity="0.18" />
        <path d="M24 42 A106 23 0 0 0 236 42" fill="none" stroke="#c3cdff" strokeWidth="10" strokeLinecap="round" />
      </svg>

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
