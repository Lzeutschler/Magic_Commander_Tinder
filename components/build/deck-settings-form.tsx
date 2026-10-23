"use client";

import { ArrowCounterClockwiseIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import {
  BUDGET_STEPS,
  SYNERGY_STEPS,
  isRecommended,
  resetToRecommendation,
  type DeckSettings,
  type GameChangerStance,
  type SwipePreferences,
} from "@/lib/deckbuilder/settings";
import {
  CURVE_PROFILES,
  TEMPLATE_ROLES,
  TEMPLATE_ROLE_LABELS,
  applyOverrides,
  curveAverage,
  type CurveProfile,
  type DeckTemplate,
  type TemplateOverrides,
  type TemplateRole,
} from "@/lib/deckbuilder/template";
import { DECK_SIZE } from "@/lib/decks/types";
import type { Bracket } from "@/lib/edhrec/types";
import { cn } from "@/lib/utils";

const ROLE_HINTS: Record<TemplateRole, string> = {
  ramp: "Mana rocks, dorks and land ramp. Land tutors like Cultivate count here.",
  draw: "Real card advantage. Cantrips and loot effects only replace themselves, so they do not count.",
  interaction: "Spot removal and counterspells for the threats that would beat you.",
  boardwipe: "Resets for when you fall behind on board.",
  protection: "Keeps your commander or key pieces alive: Lightning Greaves, Heroic Intervention. Voltron decks want many.",
  wincon: "Cards that end the game: Craterhoof, Approach of the Second Sun, extra combats.",
};

const CURVE_LABELS: Record<CurveProfile, string> = { low: "Low", balanced: "Balanced", high: "High" };

const GAME_CHANGER_LABELS: Record<GameChangerStance, string> = { prefer: "Prefer", neutral: "Neutral", avoid: "Avoid" };

/** Highest tutor limit the stepper shows before switching to "no limit". */
const MAX_TUTOR_STEP = 15;

/**
 * Targets and preferences for the deckbuilding swipe. Numbers start at the recommendation; a value
 * set back to the recommendation follows it again. `recommended` is null while it is still loading.
 */
export function DeckSettingsForm({
  settings,
  recommended,
  bracket,
  onChange,
  showBudget = true,
}: {
  settings: DeckSettings;
  recommended: DeckTemplate | null;
  /** False where the budget has its own, more prominent control. */
  showBudget?: boolean;
  bracket: Bracket;
  onChange: (settings: DeckSettings) => void;
}) {
  const template = recommended ? applyOverrides(recommended, settings.overrides, bracket) : null;

  const setOverride = <K extends keyof TemplateOverrides>(key: K, value: TemplateOverrides[K], recommendedValue: TemplateOverrides[K]) =>
    onChange({ ...settings, overrides: { ...settings.overrides, [key]: value === recommendedValue ? undefined : value } });
  const setRole = (role: TemplateRole, value: number) => {
    const roles = { ...settings.overrides.roles, [role]: value === recommended?.roles[role] ? undefined : value };
    onChange({ ...settings, overrides: { ...settings.overrides, roles } });
  };
  const setPreference = <K extends keyof SwipePreferences>(key: K, value: SwipePreferences[K]) =>
    onChange({ ...settings, preferences: { ...settings.preferences, [key]: value } });

  const maxGameChangers = BRACKET_INFO[bracket].maxGameChangers;

  return (
    <div className="space-y-6">
      <Section title="Lands" description="How the 99 split into spells and lands. Basics fill whatever nonbasics leave open.">
        {template && recommended ? (
          <>
            <Stepper
              label="Lands"
              hint={`Recommended from the EDHREC average and Frank Karsten's land formula. Leaves ${DECK_SIZE - template.lands} spell slots.`}
              value={template.lands}
              recommended={recommended.lands}
              min={20}
              max={45}
              onChange={(v) => setOverride("lands", v, recommended.lands)}
            />
            <Stepper
              label="Nonbasic lands"
              hint="Duals, fetches and utility lands offered after the spells. More colors want more."
              value={template.nonbasicLands}
              recommended={recommended.nonbasicLands}
              min={0}
              max={template.lands}
              onChange={(v) => setOverride("nonbasicLands", v, recommended.nonbasicLands)}
            />
          </>
        ) : (
          <StepperSkeleton count={2} />
        )}
      </Section>

      <Section
        title="Role targets"
        description="Suggestions favor roles below target, and push harder as open slots run out. Beyond the target, a role gets pushed back."
      >
        {template && recommended ? (
          <>
            {TEMPLATE_ROLES.map((role) => (
              <Stepper
                key={role}
                label={TEMPLATE_ROLE_LABELS[role]}
                hint={ROLE_HINTS[role]}
                value={template.roles[role]}
                recommended={recommended.roles[role]}
                min={0}
                max={30}
                onChange={(v) => setRole(role, v)}
              />
            ))}
            <Stepper
              label="Max. tutors"
              hint="Upper limit for cards that search your library for a nonland card. Fewer tutors make games less repetitive."
              value={template.maxTutors ?? MAX_TUTOR_STEP + 1}
              recommended={recommended.maxTutors ?? MAX_TUTOR_STEP + 1}
              min={0}
              max={MAX_TUTOR_STEP + 1}
              format={(v) => (v > MAX_TUTOR_STEP ? "∞" : String(v))}
              onChange={(v) => setOverride("maxTutors", v > MAX_TUTOR_STEP ? null : v, recommended.maxTutors)}
            />
          </>
        ) : (
          <StepperSkeleton count={7} />
        )}
      </Section>

      <Section
        title="Mana curve"
        description={
          template
            ? `Aims for an average mana value around ${curveAverage(template.curve).toFixed(1)}. Low suits fast and voltron decks, high suits big-mana commanders.`
            : "Low suits fast and voltron decks, high suits big-mana commanders."
        }
      >
        <Choice
          label="Mana curve"
          value={template?.curveProfile ?? "balanced"}
          options={CURVE_PROFILES.map((p) => ({ value: p, label: CURVE_LABELS[p] + (recommended?.curveProfile === p ? " (rec.)" : "") }))}
          disabled={!recommended}
          onChange={(p) => recommended && setOverride("curveProfile", p, recommended.curveProfile)}
        />
      </Section>

      <Section
        title="Synergy vs. staples"
        description="Synergy: cards that are played much more often with this commander than elsewhere. Staples: cards most of its decks run anyway."
      >
        <Choice
          label="Synergy vs. staples"
          value={String(nearestStep(settings.preferences.synergy))}
          options={SYNERGY_STEPS.map((s) => ({ value: String(s.value), label: s.label }))}
          onChange={(v) => setPreference("synergy", Number(v))}
        />
      </Section>

      {showBudget && (
        <Section title="Budget per card" description="Hides cards above this price (USD, Scryfall). Cards without a known price stay in.">
          <Choice
            label="Budget per card"
            value={String(settings.preferences.maxPriceUsd)}
            options={BUDGET_STEPS.map((b) => ({ value: String(b), label: b === null ? "No limit" : `$${b}` }))}
            onChange={(v) => setPreference("maxPriceUsd", v === "null" ? null : Number(v))}
          />
        </Section>
      )}

      <Section
        title="Game Changers"
        description={
          maxGameChangers === 0
            ? `Bracket ${bracket} allows no Game Changers, so none are offered.`
            : `Bracket ${bracket} allows ${Number.isFinite(maxGameChangers) ? `up to ${maxGameChangers}` : "any number of"} Game Changers. Prefer ranks them higher, avoid leaves them out.`
        }
      >
        <Choice
          label="Game Changers"
          value={settings.preferences.gameChangers}
          options={(["prefer", "neutral", "avoid"] as const).map((g) => ({ value: g, label: GAME_CHANGER_LABELS[g] }))}
          disabled={maxGameChangers === 0}
          onChange={(g) => setPreference("gameChangers", g)}
        />
      </Section>

      <Section title="Seen before" description="Leaves out cards you swiped left on for this commander, in this deck or an earlier one.">
        <Toggle
          variant="outline"
          pressed={settings.preferences.hidePassed}
          onPressedChange={(pressed) => setPreference("hidePassed", pressed)}
        >
          {settings.preferences.hidePassed ? "Hiding passed cards" : "Hide cards I passed before"}
        </Toggle>
      </Section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">Resets targets, curve and weighting. Budget and hidden cards stay.</p>
        <Button variant="outline" size="sm" disabled={isRecommended(settings)} onClick={() => onChange(resetToRecommendation(settings))}>
          <ArrowCounterClockwiseIcon /> Reset to recommendation
        </Button>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="ui-label text-muted-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Stepper({
  label,
  hint,
  value,
  recommended,
  min,
  max,
  format = String,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  recommended: number;
  min: number;
  max: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const changed = value !== recommended;
  return (
    <div className="panel-inset flex items-center gap-3 p-2.5 pl-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex shrink-0 flex-col items-center">
        <div className="flex items-center gap-1" role="group" aria-label={label}>
          <Button variant="outline" size="icon-sm" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
            <MinusIcon />
          </Button>
          <output className={cn("numeral w-9 text-center text-2xl", changed && "text-ember")} aria-live="polite">
            {format(value)}
          </output>
          <Button variant="outline" size="icon-sm" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
            <PlusIcon />
          </Button>
        </div>
        {changed ? (
          <Button variant="link" size="xs" className="h-6" onClick={() => onChange(recommended)}>
            rec. {format(recommended)}
          </Button>
        ) : (
          <span className="flex h-6 items-center text-[11px] text-muted-foreground">recommended</span>
        )}
      </div>
    </div>
  );
}

function StepperSkeleton({ count }: { count: number }) {
  return Array.from({ length: count }, (_, i) => <Skeleton key={i} className="h-16 w-full" />);
}

function Choice<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      variant="outline"
      size="sm"
      spacing={1}
      className="flex-wrap"
      value={[value]}
      disabled={disabled}
      onValueChange={(values) => {
        // Pressing the active option would leave nothing selected; keep it instead.
        if (values.length) onChange(values[0] as T);
      }}
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function nearestStep(value: number): number {
  return SYNERGY_STEPS.reduce((best, step) => (Math.abs(step.value - value) < Math.abs(best - value) ? step.value : best), SYNERGY_STEPS[0].value as number);
}
