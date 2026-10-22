"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ManaSymbol } from "@/components/card/mana";
import { CheckCircleIcon, WarningIcon } from "@/components/icons";
import { RoleMeters } from "@/components/swipe/deck-progress";
import { CURVE_LABELS } from "@/lib/cards/mana";
import { BRACKET_INFO, deckBracketIssues } from "@/lib/deckbuilder/brackets";
import { deckTemplate } from "@/lib/deckbuilder/template";
import { CARD_TYPES, deckStats, expandEntries } from "@/lib/decks/stats";
import { DECK_SIZE, type Deck } from "@/lib/decks/types";
import { cn } from "@/lib/utils";

export function DeckStatsPanel({ deck }: { deck: Deck }) {
  const stats = deckStats(deck);
  const template = deckTemplate(deck.bracket, deck.commander.colorIdentity, null);
  const issues = deckBracketIssues(expandEntries(deck.entries), deck.bracket);
  const missing = DECK_SIZE - stats.total;
  const curveData = stats.curve.map((count, i) => ({ label: CURVE_LABELS[i], count }));
  const colors = deck.commander.colorIdentity;
  const totalPips = colors.reduce((sum, c) => sum + stats.pips[c], 0);

  return (
    <div className="space-y-4">
      <section className="panel space-y-3 p-4">
        <div className="flex items-baseline justify-between">
          <span className="numeral text-5xl">
            {stats.total}
            <span className="text-xl text-muted-foreground">/{DECK_SIZE}</span>
          </span>
          <span className="text-sm text-muted-foreground">+ commander</span>
        </div>
        <StatusLine ok={missing === 0}>
          {missing === 0 ? "Deck size is legal" : missing > 0 ? `${missing} cards missing` : `${-missing} cards too many`}
        </StatusLine>
        <StatusLine ok={issues.length === 0}>
          {issues.length === 0 ? `Fits bracket ${deck.bracket} (${BRACKET_INFO[deck.bracket].name})` : issues.join(" · ")}
        </StatusLine>
        <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
          <Metric label="avg. mana value" value={stats.averageManaValue.toFixed(2)} />
          <Metric label="lands" value={String(stats.lands)} />
          <Metric label="est. price" value={`$${Math.round(stats.priceUsd)}`} />
        </div>
      </section>

      <section className="panel space-y-2 p-4">
        <h3 className="ui-label text-muted-foreground">Mana curve</h3>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={curveData} margin={{ top: 8, right: 4, bottom: 0, left: -28 }}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: "oklch(1 0 0 / 5%)" }}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, boxShadow: "var(--shadow-lg)" }}
                formatter={(value) => [value, "cards"]}
              />
              <Bar dataKey="count" fill="var(--brand)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel space-y-3 p-4">
        <h3 className="ui-label text-muted-foreground">Roles</h3>
        <RoleMeters stats={stats} template={template} />
      </section>

      {colors.length > 0 && (
        <section className="panel space-y-2 p-4">
          <h3 className="ui-label text-muted-foreground">Colors: pips vs. land sources</h3>
          <table className="w-full text-sm">
            <tbody>
              {colors.map((color) => (
                <tr key={color} className="border-b border-border/60 last:border-0">
                  <td className="py-1.5">
                    <ManaSymbol symbol={color} />
                  </td>
                  <td className="py-1.5 text-muted-foreground">
                    {totalPips ? Math.round((stats.pips[color] / totalPips) * 100) : 0}% of pips
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{stats.sources[color]} sources</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="panel space-y-2 p-4">
        <h3 className="ui-label text-muted-foreground">Card types</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {CARD_TYPES.filter((type) => stats.types[type]).map((type) => (
            <div key={type} className="flex justify-between">
              <span className="text-muted-foreground">{type}</span>
              <span className="tabular-nums">{stats.types[type]}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatusLine({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const Icon = ok ? CheckCircleIcon : WarningIcon;
  return (
    <p className={cn("flex items-start gap-2 text-sm", ok ? "text-pick" : "text-brand")}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-inset p-2">
      <div className="numeral text-2xl">{value}</div>
      <div className="mt-1 text-[11px] leading-tight text-muted-foreground">{label}</div>
    </div>
  );
}
