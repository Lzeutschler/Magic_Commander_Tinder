import type { Color } from "@/lib/cards/types";
import { cn } from "@/lib/utils";

const SYMBOL_HOST = "https://svgs.scryfall.io/card-symbols";

/** Scryfall's SVG for a mana symbol: "{W/U}" → WU.svg, "{2}" → 2.svg. */
function symbolUrl(symbol: string): string {
  return `${SYMBOL_HOST}/${symbol.replace(/\//g, "").toUpperCase()}.svg`;
}

export function ManaSymbol({ symbol, className }: { symbol: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static SVGs from Scryfall
    <img src={symbolUrl(symbol)} alt={`{${symbol}}`} className={cn("inline-block size-4 shrink-0", className)} />
  );
}

export function ManaCost({ cost, className }: { cost: string; className?: string }) {
  if (!cost) return null;
  const faces = cost.split(" // ");
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {faces.map((face, i) => (
        <span key={i} className="inline-flex items-center gap-0.5">
          {i > 0 && <span className="px-0.5 text-muted-foreground">/</span>}
          {[...face.matchAll(/\{([^}]+)\}/g)].map((m, j) => (
            <ManaSymbol key={j} symbol={m[1]} />
          ))}
        </span>
      ))}
    </span>
  );
}

export function ColorIdentity({ colors, className }: { colors: readonly Color[]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {(colors.length ? colors : ["C"]).map((c) => (
        <ManaSymbol key={c} symbol={c} />
      ))}
    </span>
  );
}
