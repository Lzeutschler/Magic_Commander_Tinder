"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { CardImage } from "@/components/card/card-image";
import { ColorIdentity } from "@/components/card/mana";
import { EdhrecLink } from "@/components/edhrec-link";
import { ArrowRightIcon, CaretDownIcon, CircleNotchIcon, SlidersHorizontalIcon, XIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { identityName } from "@/lib/cards/colors";
import type { CommanderSummary } from "@/lib/cards/types";
import { fetchCandidatePool, useCommanderInsights } from "@/lib/data/client";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import { describeSettings, type DeckSettings } from "@/lib/deckbuilder/settings";
import { profilePool, recommendTemplate } from "@/lib/deckbuilder/template";
import { edhrecCommanderUrl } from "@/lib/edhrec/links";
import type { Bracket } from "@/lib/edhrec/types";
import { THEMES } from "@/lib/tagging/themes";
import { cn } from "@/lib/utils";
import { useDeckStore } from "@/stores/decks";

import { BracketPicker } from "./bracket-picker";
import { DeckSettingsForm } from "./deck-settings-form";

const MAX_THEMES = 12;
const THEME_LABELS = new Map(THEMES.map((t) => [t.id, t.label]));

/**
 * The chosen commander with bracket and EDHREC theme pickers. Starting creates the deck and opens
 * the deckbuilding swipe. `children` render below the commander's name, e.g. why it was suggested.
 */
export function CommanderSetup({
  commander,
  onClose,
  onStart,
  closeLabel = "Choose another commander",
  children,
}: {
  commander: CommanderSummary;
  onClose: () => void;
  closeLabel?: string;
  /** Called with the new deck's id right before navigating to it. */
  onStart?: (deckId: string) => void;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const createDeck = useDeckStore((s) => s.createDeck);
  const [bracket, setBracket] = useState<Bracket>(2);
  // The theme belongs to one commander; choosing another commander resets it.
  const [themeChoice, setThemeChoice] = useState<{ commanderId: string; slug: string | null } | null>(null);
  const theme = themeChoice?.commanderId === commander.id ? themeChoice.slug : null;
  const setTheme = (slug: string | null) => setThemeChoice({ commanderId: commander.id, slug });
  const [starting, setStarting] = useState(false);
  const insights = useCommanderInsights(commander.name);

  // Swipe settings start from the preferences used last and, like the theme, belong to one commander.
  const lastPreferences = useDeckStore((s) => s.lastPreferences);
  const [settingsChoice, setSettingsChoice] = useState<{ commanderId: string; settings: DeckSettings } | null>(null);
  const settings =
    settingsChoice?.commanderId === commander.id ? settingsChoice.settings : { overrides: {}, preferences: lastPreferences };
  const setSettings = (next: DeckSettings) => setSettingsChoice({ commanderId: commander.id, settings: next });
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // The recommendation needs the candidate pool; the swipe reuses this query once it starts.
  const commanderName = insights.data?.commander.name ?? null;
  const pool = useQuery({
    queryKey: ["candidates", commanderName, bracket, theme],
    queryFn: () => fetchCandidatePool(commanderName!, bracket, theme),
    enabled: advancedOpen && Boolean(commanderName),
    staleTime: Infinity,
  });
  const recommended = useMemo(
    () => (pool.data ? recommendTemplate(bracket, commander.colorIdentity, profilePool(pool.data)) : null),
    [pool.data, bracket, commander.colorIdentity],
  );
  const settingsNotes = describeSettings(settings);

  const start = () => {
    if (!insights.data) return;
    setStarting(true);
    const id = createDeck({ commander: insights.data.commander, bracket, theme, settings, recommendation: recommended ?? undefined });
    onStart?.(id);
    router.push(`/build/${id}`);
  };

  return (
    <section className="panel grid gap-6 p-4 sm:p-6 md:grid-cols-[260px_1fr]">
      <div className="mx-auto w-40 sm:w-56 md:w-full">
        <CardImage card={commander} flippable eager />
      </div>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl leading-tight font-bold">{commander.name}</h2>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <ColorIdentity colors={commander.colorIdentity} />
              {identityName(commander.colorIdentity)} · {commander.typeLine}
            </p>
            {insights.data && insights.data.deckCount > 0 && (
              <p className="text-xs text-muted-foreground">
                <EdhrecLink href={edhrecCommanderUrl(commander.name, bracket, theme)}>
                  {insights.data.deckCount.toLocaleString()} decks on EDHREC
                </EdhrecLink>
              </p>
            )}
            {commander.partner && (
              <p className="text-xs text-brand">Partner and background pairings are coming later — you can build it solo for now.</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={closeLabel}>
            <XIcon />
          </Button>
        </div>
        {children}

        <div className="space-y-3">
          <h3 className="ui-label text-muted-foreground">Bracket</h3>
          <BracketPicker value={bracket} onChange={setBracket} deckCounts={insights.data?.bracketCounts} />
          <p className="text-sm text-muted-foreground">{BRACKET_INFO[bracket].description}</p>
        </div>

        <div className="space-y-3">
          <h3 className="ui-label text-muted-foreground">Theme (optional)</h3>
          {insights.isLoading ? (
            <div className="flex gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-24 rounded-md" />
              ))}
            </div>
          ) : insights.data?.themes.length ? (
            <div className="flex flex-wrap gap-2">
              <ThemeChip active={theme === null} onClick={() => setTheme(null)}>
                Anything goes
              </ThemeChip>
              {insights.data.themes.slice(0, MAX_THEMES).map((t) => (
                <ThemeChip key={t.slug} active={theme === t.slug} onClick={() => setTheme(t.slug)}>
                  {t.label}
                  <span className="text-[11px] text-muted-foreground tabular-nums">{t.deckCount.toLocaleString()}</span>
                </ThemeChip>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {commander.themes.map((t) => (
                <Badge key={t} variant="secondary">
                  {THEME_LABELS.get(t) ?? t}
                </Badge>
              ))}
              <span className="text-sm text-muted-foreground">No EDHREC themes for this commander yet.</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Button variant="ghost" size="sm" className="-ml-3" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((open) => !open)}>
              <SlidersHorizontalIcon /> Advanced settings
              <CaretDownIcon className={cn("transition-transform", advancedOpen && "rotate-180")} />
            </Button>
            {!advancedOpen && (
              <span className="text-xs text-muted-foreground">
                {settingsNotes.length ? settingsNotes.join(" · ") : "Land count, role targets, curve, budget"}
              </span>
            )}
          </div>
          {advancedOpen && (
            <div className="rounded-lg border border-border p-4">
              {pool.error && (
                <p className="mb-4 text-sm text-destructive">Could not load the recommendation: {pool.error.message}</p>
              )}
              <DeckSettingsForm settings={settings} recommended={recommended} bracket={bracket} onChange={setSettings} />
            </div>
          )}
        </div>

        {/* Phones keep the button at the bottom of the screen while scrolling through brackets and themes. */}
        <div className="space-y-3 max-sm:sticky max-sm:bottom-0 max-sm:z-10 max-sm:-mx-4 max-sm:border-t max-sm:border-border max-sm:bg-card max-sm:px-4 max-sm:py-3 max-sm:shadow-[0_-6px_16px_oklch(0_0_0/45%)]">
          <Button size="lg" className="w-full sm:w-auto" onClick={start} disabled={!insights.data || starting}>
            {starting || insights.isLoading ? <CircleNotchIcon className="animate-spin" /> : null}
            Start swiping
            <ArrowRightIcon />
          </Button>
          {insights.error && <p className="text-sm text-destructive">{insights.error.message}</p>}
        </div>
      </div>
    </section>
  );
}

function ThemeChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium shadow-sm transition hover:border-input hover:bg-accent",
        active && "border-brand bg-brand/12 text-foreground hover:border-brand hover:bg-brand/12",
      )}
    >
      {children}
    </button>
  );
}
