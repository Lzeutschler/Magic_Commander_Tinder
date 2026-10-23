"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { CardHoverPreview } from "@/components/card/card-hover-preview";
import { CardImage } from "@/components/card/card-image";
import { ManaCost } from "@/components/card/mana";
import { BrewLoader, CelebrationCauldron } from "@/components/cauldron";
import { EdhrecLink } from "@/components/edhrec-link";
import {
  ArrowLeftIcon,
  ArrowUUpLeftIcon,
  CardsIcon,
  CheckIcon,
  SlidersHorizontalIcon,
} from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cardImageUrl } from "@/lib/cards/image";
import { frontFaceName } from "@/lib/cards/names";
import { fetchCandidatePool } from "@/lib/data/client";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import { explainCandidate, type CandidateReason } from "@/lib/deckbuilder/score";
import {
  nextCandidate,
  rankCandidates,
  scoreContext,
  type SwipeDecision,
  type SwipeSession,
} from "@/lib/deckbuilder/session";
import { deckTemplate } from "@/lib/deckbuilder/settings";
import type { Candidate } from "@/lib/deckbuilder/types";
import { deckStats } from "@/lib/decks/stats";
import { edhrecCardUrl, edhrecCommanderUrl } from "@/lib/edhrec/links";
import { DECK_SIZE, type Deck } from "@/lib/decks/types";
import { randomSeed } from "@/lib/random";
import { ROLE_LABELS } from "@/lib/tagging/roles";
import { cn } from "@/lib/utils";
import { useDeckStore, useDecksHydrated } from "@/stores/decks";

import { DeckSettingsDialog } from "./deck-settings-dialog";
import { CompactRoleMeters, DeckCounter, MiniCurve, RoleMeters } from "./deck-progress";
import { SwipeButtons, SwipeStack, useSwipeKeys } from "./swipe-controls";

export function SwipeScreen({ deckId }: { deckId: string }) {
  const hydrated = useDecksHydrated();
  const deck = useDeckStore((s) => s.decks[deckId]);
  const session = useDeckStore((s) => s.sessions[deckId]);
  const startSession = useDeckStore((s) => s.startSession);

  const pool = useQuery({
    queryKey: ["candidates", deck?.commander.name, deck?.bracket, deck?.theme],
    queryFn: () => fetchCandidatePool(deck!.commander.name, deck!.bracket, deck!.theme),
    enabled: hydrated && Boolean(deck) && !session,
    staleTime: Infinity,
  });

  // Start a session once per visit; finishing the deck removes it again and must not restart it.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !deck || session || !pool.data) return;
    started.current = true;
    startSession(deck.id, pool.data, randomSeed());
  }, [deck, session, pool.data, startSession]);

  if (!hydrated) return <FullScreenMessage loading>Loading your decks…</FullScreenMessage>;
  if (!deck) {
    return (
      <FullScreenMessage>
        This deck does not exist on this device.{" "}
        <Link href="/build" className="text-brand underline underline-offset-4">
          Start a new one
        </Link>
      </FullScreenMessage>
    );
  }
  if (pool.error) {
    return (
      <FullScreenMessage>
        Could not load card suggestions: {pool.error.message}
        <Button variant="outline" onClick={() => pool.refetch()}>
          Try again
        </Button>
      </FullScreenMessage>
    );
  }
  if (!session) {
    return <FullScreenMessage loading>Stirring in suggestions for {frontFaceName(deck.commander.name)}…</FullScreenMessage>;
  }
  return <SwipeBoard deck={deck} session={session} />;
}

function SwipeBoard({ deck, session }: { deck: Deck; session: SwipeSession }) {
  const router = useRouter();
  const swipe = useDeckStore((s) => s.swipe);
  const undoSwipe = useDeckStore((s) => s.undoSwipe);
  const skipToLands = useDeckStore((s) => s.skipToLands);
  const finishSwipe = useDeckStore((s) => s.finishSwipe);
  const [lastDecision, setLastDecision] = useState<SwipeDecision | null>(null);

  const stats = useMemo(() => deckStats(deck), [deck]);
  const template = useMemo(() => deckTemplate(deck), [deck]);
  const current = useMemo(() => nextCandidate(session, deck), [session, deck]);
  const reasons = useMemo(
    () => (current ? explainCandidate(current, scoreContext(session, deck), frontFaceName(deck.commander.name)) : []),
    [current, session, deck],
  );

  // Warm the image cache for the cards most likely to come next.
  useEffect(() => {
    for (const { candidate } of rankCandidates(session, deck).slice(0, 6)) {
      if (candidate.image) new Image().src = cardImageUrl(candidate.image, "large");
    }
  }, [session, deck]);

  const previousPhase = useRef(session.phase);
  useEffect(() => {
    if (previousPhase.current === "spells" && session.phase === "lands") {
      toast.success("Spells done! Now pick your nonbasic lands.");
    }
    previousPhase.current = session.phase;
  }, [session.phase]);

  const decideCurrent = (decision: SwipeDecision) => {
    if (!current) return;
    setLastDecision(decision);
    swipe(deck.id, current.id, decision);
  };
  const undo = () => {
    setLastDecision(null);
    undoSwipe(deck.id);
  };
  const finish = () => {
    finishSwipe(deck.id);
    router.push(`/decks/${deck.id}`);
  };

  useSwipeKeys(decideCurrent, undo);

  const recentPicks = session.history
    .filter((h) => h.decision === "pick")
    .slice(-8)
    .reverse()
    .map((h) => deck.entries.find((e) => e.card.id === h.cardId)?.card)
    .filter((c) => c !== undefined);

  return (
    <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-3 lg:grid-cols-[280px_1fr_300px] lg:py-6">
      {/* Deck progress */}
      <aside className="panel order-2 space-y-5 p-5 lg:order-1">
        <div className="flex items-center gap-3">
          <div className="w-14 shrink-0">
            <CardImage card={deck.commander} size="small" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-heading text-lg leading-tight font-bold">{deck.name}</div>
            <div className="text-xs text-muted-foreground">
              Bracket {deck.bracket} · {BRACKET_INFO[deck.bracket].name}
              {deck.theme ? ` · ${deck.theme}` : ""}
            </div>
          </div>
        </div>
        <DeckCounter deck={deck} stats={stats} template={template} />
        <RoleMeters stats={stats} template={template} />
        <div>
          <div className="ui-label mb-1.5 text-muted-foreground">Mana curve <span className="normal-case tracking-normal font-normal">(dashed = target)</span></div>
          <MiniCurve stats={stats} template={template} />
        </div>
        <div className="flex flex-col gap-2">
          <DeckSettingsDialog deck={deck} />
          {session.phase === "spells" && (
            <Button variant="outline" onClick={() => skipToLands(deck.id)}>
              Skip to lands
            </Button>
          )}
          <Button variant="outline" onClick={finish}>
            Finish with basics &amp; edit
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {session.source === "edhrec" ? (
            <>
              Suggestions from{" "}
              <EdhrecLink href={edhrecCommanderUrl(deck.commander.name, deck.bracket, deck.theme)}>
                {session.deckCount.toLocaleString()} EDHREC decks
              </EdhrecLink>
              .
            </>
          ) : (
            "EDHREC has little data on this commander, so suggestions use card popularity and themes."
          )}
        </p>
      </aside>

      {/* Swipe stack */}
      <section className="order-1 flex flex-col items-center gap-3 select-none lg:order-2 lg:gap-5">
        <div className="flex w-full max-w-md items-center justify-between gap-2">
          <div className="ui-label flex items-center gap-2 text-muted-foreground">
            <CardsIcon className="size-4" />
            {/* Below lg the deck panel sits under the card, so the count (or, before the first swipe, the gestures) goes here. */}
            {session.history.length === 0 && session.phase !== "done" ? (
              <span className="lg:hidden">Swipe → pick · ← pass · ↑ maybe</span>
            ) : (
              <span className="lg:hidden">
                <span className="text-foreground tabular-nums">{stats.total}</span>/{DECK_SIZE} ·
              </span>
            )}
            <span className={cn(session.history.length === 0 && session.phase !== "done" && "max-lg:hidden")}>
              {PHASE_LABELS[session.phase]}
            </span>
          </div>
          <DeckSettingsDialog
            deck={deck}
            trigger={
              <Button variant="ghost" size="sm" className="lg:hidden">
                <SlidersHorizontalIcon /> Settings
              </Button>
            }
          />
        </div>

        {session.phase === "done" || !current ? (
          <DonePanel deck={deck} onFinish={finish} onUndo={undo} canUndo={session.history.length > 0} />
        ) : (
          <>
            <div className="w-full max-w-md lg:hidden">
              <CompactRoleMeters stats={stats} template={template} />
            </div>
            <SwipeStack
              card={current}
              cardKey={current.id}
              lastDecision={lastDecision}
              onDecision={decideCurrent}
              // Leaves room for the role meters above and the reasons below the buttons.
              className="max-lg:w-[min(400px,84vw,calc((100dvh-20rem)*0.7176))]"
            />
            <SwipeButtons onDecision={decideCurrent} onUndo={undo} canUndo={session.history.length > 0} />
            <p className="hidden text-xs text-muted-foreground lg:block">Drag the card or use ← ↑ → · Z to undo</p>
            <CompactWhy candidate={current} reasons={reasons} />
          </>
        )}
      </section>

      {/* Why this card */}
      <aside className="order-3 space-y-5">
        {current && session.phase !== "done" && (
          <div className="panel hidden space-y-4 p-5 lg:block">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-heading text-2xl leading-tight font-bold">{current.name}</h2>
                <ManaCost cost={current.manaCost} className="pt-1" />
              </div>
              <p className="text-xs text-muted-foreground">{current.typeLine}</p>
            </div>
            <FitMeters candidate={current} deckCount={session.deckCount} />
            {reasons.length > 0 && (
              <ul className="space-y-1.5 text-sm">
                {reasons.slice(0, 3).map(({ text }) => (
                  <li key={text} className="flex gap-2">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden />
                    {text}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-1.5">
              {current.gameChanger && <Badge>Game Changer</Badge>}
              {current.roles
                .filter((r) => r !== "mld" && r !== "extraturn")
                .map((role) => (
                  <Badge key={role} variant="secondary">
                    {ROLE_LABELS[role]}
                  </Badge>
                ))}
              {current.priceUsd !== null && <Badge variant="outline">${current.priceUsd.toFixed(2)}</Badge>}
            </div>
            <EdhrecLink href={edhrecCardUrl(current.name)} className="text-xs text-muted-foreground">
              {current.name} on EDHREC
            </EdhrecLink>
          </div>
        )}

        <div className="panel space-y-3 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="ui-label text-muted-foreground">Recent picks</span>
            <Link href={`/decks/${deck.id}`} className="-my-2 inline-flex min-h-10 items-center text-xs text-muted-foreground hover:text-foreground">
              Open deck →
            </Link>
          </div>
          {recentPicks.length === 0 ? (
            <p className="text-xs text-muted-foreground">Swipe right on cards you want.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {recentPicks.map((card) => (
                <CardHoverPreview key={card.id} card={card}>
                  <li className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
                    <span className="truncate">{card.name}</span>
                    <ManaCost cost={card.manaCost} />
                  </li>
                </CardHoverPreview>
              ))}
            </ul>
          )}
          {deck.maybe.length > 0 && (
            <p className="text-xs text-maybe">{deck.maybe.length} on your maybe list</p>
          )}
        </div>
      </aside>
    </div>
  );
}

const PHASE_LABELS: Record<SwipeSession["phase"], string> = {
  spells: "Spells & permanents",
  lands: "Nonbasic lands",
  done: "Deck complete",
};

/** The "why this card" panel in brief, under the buttons where the panel itself sits far below the card. */
function CompactWhy({ candidate, reasons }: { candidate: Candidate; reasons: CandidateReason[] }) {
  const synergy = Math.round(candidate.synergy * 100);
  // The badges already show synergy and popularity, so the lines say what the deck needs.
  const deckReasons = reasons.filter((r) => r.kind === "deck").slice(0, 2);
  return (
    <div className="w-full max-w-md space-y-2 lg:hidden">
      <div className="flex flex-wrap justify-center gap-1.5">
        <Badge variant={synergy > 0 ? "default" : "secondary"}>
          {synergy > 0 ? "+" : ""}
          {synergy}% synergy
        </Badge>
        <Badge variant="secondary">{Math.round(candidate.inclusion * 100)}% of decks</Badge>
        {candidate.gameChanger && <Badge>Game Changer</Badge>}
        {candidate.roles
          .filter((r) => r !== "mld" && r !== "extraturn")
          .slice(0, 2)
          .map((role) => (
            <Badge key={role} variant="outline">
              {ROLE_LABELS[role]}
            </Badge>
          ))}
        {candidate.priceUsd !== null && <Badge variant="outline">${candidate.priceUsd.toFixed(2)}</Badge>}
        <EdhrecLink href={edhrecCardUrl(candidate.name)} className="px-1 text-xs text-muted-foreground">
          EDHREC
        </EdhrecLink>
      </div>
      {deckReasons.length > 0 && (
        <ul className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground">
          {deckReasons.map(({ text }) => (
            <li key={text} className="flex gap-1.5">
              <CheckIcon className="mt-px size-3.5 shrink-0 text-teal" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FitMeters({ candidate, deckCount }: { candidate: Candidate; deckCount: number }) {
  const synergy = Math.round(candidate.synergy * 100);
  const inclusion = Math.round(candidate.inclusion * 100);
  return (
    <div className="grid grid-cols-2 gap-3 text-center">
      <div className="panel-inset rounded-lg p-2.5">
        <div className={cn("numeral text-3xl", synergy > 0 ? "text-brand" : "text-muted-foreground")}>
          {synergy > 0 ? "+" : ""}
          {synergy}%
        </div>
        <div className="ui-label mt-1 text-xs text-muted-foreground">synergy</div>
      </div>
      <div className="panel-inset rounded-lg p-2.5">
        <div className="numeral text-3xl">{inclusion}%</div>
        <div className="ui-label mt-1 text-xs text-muted-foreground">{deckCount ? `of ${deckCount.toLocaleString()} decks` : "popularity"}</div>
      </div>
    </div>
  );
}

function DonePanel({
  deck,
  onFinish,
  onUndo,
  canUndo,
}: {
  deck: Deck;
  onFinish: () => void;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const stats = deckStats(deck);
  return (
    <div className="panel flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
      <CelebrationCauldron className="-mt-2 text-[4.5px]" />
      <h2 className="text-2xl font-bold">Your brew is ready</h2>
      <p className="text-muted-foreground">
        {stats.nonlands} spells and {stats.lands} lands picked.{" "}
        {DECK_SIZE - stats.total > 0 && `${DECK_SIZE - stats.total} basic lands will complete the 99.`}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onUndo} disabled={!canUndo}>
          <ArrowUUpLeftIcon /> Undo
        </Button>
        <Button onClick={onFinish}>Finish &amp; open editor</Button>
      </div>
    </div>
  );
}

function FullScreenMessage({ children, loading }: { children: React.ReactNode; loading?: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center text-muted-foreground">
      {loading ? <BrewLoader>{children}</BrewLoader> : <div className="flex flex-col items-center gap-3">{children}</div>}
      {!loading && (
        <Link href="/build" className="inline-flex min-h-10 items-center gap-1.5 text-sm hover:text-foreground">
          <ArrowLeftIcon className="size-4" /> Back to build
        </Link>
      )}
    </div>
  );
}
