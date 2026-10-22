"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { CardBack } from "@/components/card/card-back";
import { CardHoverPreview } from "@/components/card/card-hover-preview";
import { CardImage } from "@/components/card/card-image";
import { ManaCost } from "@/components/card/mana";
import {
  ArrowLeftIcon,
  ArrowUUpLeftIcon,
  CardsIcon,
  CircleNotchIcon,
  HeartIcon,
  SparkleIcon,
  StarIcon,
  XIcon,
} from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cardImageUrl } from "@/lib/cards/image";
import { frontFaceName } from "@/lib/cards/names";
import { fetchCandidatePool } from "@/lib/data/client";
import { BRACKET_INFO } from "@/lib/deckbuilder/brackets";
import { explainCandidate } from "@/lib/deckbuilder/score";
import {
  createSession,
  nextCandidate,
  rankCandidates,
  type SwipeDecision,
  type SwipeSession,
} from "@/lib/deckbuilder/session";
import type { Candidate } from "@/lib/deckbuilder/types";
import { deckStats } from "@/lib/decks/stats";
import { DECK_SIZE, type Deck } from "@/lib/decks/types";
import { randomSeed } from "@/lib/random";
import { ROLE_LABELS } from "@/lib/tagging/roles";
import { cn } from "@/lib/utils";
import { useDeckStore, useDecksHydrated } from "@/stores/decks";

import { DeckCounter, MiniCurve, RoleMeters } from "./deck-progress";
import { SwipeCard } from "./swipe-card";

export function SwipeScreen({ deckId }: { deckId: string }) {
  const hydrated = useDecksHydrated();
  const deck = useDeckStore((s) => s.decks[deckId]);
  const session = useDeckStore((s) => s.sessions[deckId]);
  const setSession = useDeckStore((s) => s.setSession);

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
    setSession(deck.id, createSession(deck, pool.data, randomSeed()));
  }, [deck, session, pool.data, setSession]);

  if (!hydrated) return <FullScreenMessage loading>Loading your decks…</FullScreenMessage>;
  if (!deck) {
    return (
      <FullScreenMessage>
        This deck does not exist on this device.{" "}
        <Link href="/build" className="text-ember underline underline-offset-4">
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
    return <FullScreenMessage loading>Shuffling suggestions for {frontFaceName(deck.commander.name)}…</FullScreenMessage>;
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
  const current = useMemo(() => nextCandidate(session, deck), [session, deck]);
  const reasons = useMemo(
    () => (current ? explainCandidate(current, stats, session.template, frontFaceName(deck.commander.name)) : []),
    [current, stats, session.template, deck.commander.name],
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;
      if (e.key === "ArrowRight") decideCurrent("pick");
      else if (e.key === "ArrowLeft") decideCurrent("pass");
      else if (e.key === "ArrowUp") decideCurrent("maybe");
      else if (e.key === "Backspace" || e.key.toLowerCase() === "z") undo();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const recentPicks = session.history
    .filter((h) => h.decision === "pick")
    .slice(-8)
    .reverse()
    .map((h) => deck.entries.find((e) => e.card.id === h.cardId)?.card)
    .filter((c) => c !== undefined);

  return (
    <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[280px_1fr_300px]">
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
        <DeckCounter deck={deck} stats={stats} template={session.template} />
        <RoleMeters stats={stats} template={session.template} />
        <div>
          <div className="eyebrow mb-1.5 text-muted-foreground">Mana curve <span className="normal-case tracking-normal font-normal">(dashed = target)</span></div>
          <MiniCurve stats={stats} template={session.template} />
        </div>
        <div className="flex flex-col gap-2">
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
          {session.source === "edhrec"
            ? `Suggestions from ${session.deckCount.toLocaleString()} EDHREC decks.`
            : "EDHREC has little data on this commander, so suggestions use card popularity and themes."}
        </p>
      </aside>

      {/* Swipe stack */}
      <section className="order-1 flex flex-col items-center gap-5 select-none lg:order-2">
        <div className="eyebrow flex items-center gap-2 text-muted-foreground">
          <CardsIcon className="size-4" />
          {session.phase === "spells" && "Spells & permanents"}
          {session.phase === "lands" && "Nonbasic lands"}
          {session.phase === "done" && "Deck complete"}
        </div>

        {session.phase === "done" || !current ? (
          <DonePanel deck={deck} onFinish={finish} onUndo={undo} canUndo={session.history.length > 0} />
        ) : (
          <>
            <div className="relative aspect-[488/680] w-[min(340px,80vw,calc((100dvh-16rem)*0.7176))] min-w-48">
              <CardBack className="absolute inset-0 translate-x-3 translate-y-3 rotate-3 opacity-50" />
              <CardBack className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-1 opacity-80" />
              <AnimatePresence custom={lastDecision} initial={false}>
                <SwipeCard key={current.id} candidate={current} onDecision={decideCurrent} />
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-4">
              <RoundButton label="Undo (Z)" onClick={undo} disabled={!session.history.length} className="size-11">
                <ArrowUUpLeftIcon className="size-5" />
              </RoundButton>
              <RoundButton label="Pass (←)" onClick={() => decideCurrent("pass")} className="size-16 border-pass/70 text-pass hover:bg-pass/15">
                <XIcon className="size-8" />
              </RoundButton>
              <RoundButton label="Maybe (↑)" onClick={() => decideCurrent("maybe")} className="size-12 border-maybe/70 text-maybe hover:bg-maybe/15">
                <StarIcon className="size-5" />
              </RoundButton>
              <RoundButton label="Pick (→)" onClick={() => decideCurrent("pick")} className="size-16 border-pick/70 text-pick hover:bg-pick/15">
                <HeartIcon className="size-8" />
              </RoundButton>
            </div>
            <p className="hidden text-xs text-muted-foreground sm:block">Drag the card or use ← ↑ → · Z to undo</p>
          </>
        )}
      </section>

      {/* Why this card */}
      <aside className="order-3 space-y-5">
        {current && session.phase !== "done" && (
          <div className="panel space-y-4 p-5">
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
                {reasons.map((reason) => (
                  <li key={reason} className="flex gap-2">
                    <SparkleIcon className="mt-0.5 size-3.5 shrink-0 text-ember" />
                    {reason}
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
          </div>
        )}

        <div className="panel space-y-3 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="eyebrow text-muted-foreground">Recent picks</span>
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

function FitMeters({ candidate, deckCount }: { candidate: Candidate; deckCount: number }) {
  const synergy = Math.round(candidate.synergy * 100);
  const inclusion = Math.round(candidate.inclusion * 100);
  return (
    <div className="grid grid-cols-2 gap-3 text-center">
      <div className="panel-inset rounded-lg p-2.5">
        <div className={cn("numeral text-3xl", synergy > 0 ? "text-ember" : "text-muted-foreground")}>
          {synergy > 0 ? "+" : ""}
          {synergy}%
        </div>
        <div className="eyebrow mt-1 text-[0.6875rem] text-muted-foreground">synergy</div>
      </div>
      <div className="panel-inset rounded-lg p-2.5">
        <div className="numeral text-3xl">{inclusion}%</div>
        <div className="eyebrow mt-1 text-[0.6875rem] text-muted-foreground">{deckCount ? `of ${deckCount.toLocaleString()} decks` : "popularity"}</div>
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
      <SparkleIcon className="size-10 text-ember" />
      <h2 className="text-2xl font-bold">Your deck is ready</h2>
      <p className="text-muted-foreground">
        {stats.nonlands} spells and {stats.lands} nonbasic lands picked.{" "}
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

function RoundButton({
  label,
  className,
  children,
  ...props
}: { label: string } & React.ComponentProps<"button">) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            className={cn(
              "grid place-items-center rounded-full border-2 border-input bg-card shadow-[inset_0_1px_0_0_oklch(1_0_0/8%),0_3px_0_0_oklch(0_0_0/55%)] transition hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[inset_0_1px_0_0_oklch(1_0_0/8%),0_1px_0_0_oklch(0_0_0/55%)] disabled:pointer-events-none disabled:opacity-40",
              className,
            )}
            {...props}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function FullScreenMessage({ children, loading }: { children: React.ReactNode; loading?: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center text-muted-foreground">
      {loading && <CircleNotchIcon className="size-8 animate-spin text-ember" />}
      <div className="flex flex-col items-center gap-3">{children}</div>
      {!loading && (
        <Link href="/build" className="inline-flex min-h-10 items-center gap-1.5 text-sm hover:text-foreground">
          <ArrowLeftIcon className="size-4" /> Back to build
        </Link>
      )}
    </div>
  );
}
