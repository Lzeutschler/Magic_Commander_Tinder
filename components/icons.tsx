import type { Icon, IconProps } from "@phosphor-icons/react";
import {
  ArrowCounterClockwiseIcon as ArrowCounterClockwiseBase,
  ArrowLeftIcon as ArrowLeftBase,
  ArrowRightIcon as ArrowRightBase,
  ArrowUpRightIcon as ArrowUpRightBase,
  ArrowsClockwiseIcon as ArrowsClockwiseBase,
  ArrowUUpLeftIcon as ArrowUUpLeftBase,
  CaretDownIcon as CaretDownBase,
  CaretLeftIcon as CaretLeftBase,
  CaretRightIcon as CaretRightBase,
  CardsIcon as CardsBase,
  ChartBarIcon as ChartBarBase,
  CheckCircleIcon as CheckCircleBase,
  CheckIcon as CheckBase,
  CircleNotchIcon as CircleNotchBase,
  CopyIcon as CopyBase,
  DownloadSimpleIcon as DownloadSimpleBase,
  HandIcon as HandBase,
  HeartIcon as HeartBase,
  InfoIcon as InfoBase,
  KeyboardIcon as KeyboardBase,
  ListChecksIcon as ListChecksBase,
  ListIcon as ListBase,
  MagnifyingGlassIcon as MagnifyingGlassBase,
  MinusIcon as MinusBase,
  NotePencilIcon as NotePencilBase,
  PlayIcon as PlayBase,
  PlusIcon as PlusBase,
  ShuffleIcon as ShuffleBase,
  SidebarSimpleIcon as SidebarSimpleBase,
  SkipForwardIcon as SkipForwardBase,
  SparkleIcon as SparkleBase,
  StackIcon as StackBase,
  StarIcon as StarBase,
  SwordIcon as SwordBase,
  TrashIcon as TrashBase,
  UploadSimpleIcon as UploadSimpleBase,
  WarningIcon as WarningBase,
  XCircleIcon as XCircleBase,
  XIcon as XBase,
} from "@phosphor-icons/react/ssr";

import { cn } from "@/lib/utils";

/** Phosphor icons default to the bold weight here: it holds up at 16px next to condensed labels. */
function bold(Base: Icon, name: string) {
  function BoldIcon(props: IconProps) {
    return <Base weight="bold" {...props} />;
  }
  BoldIcon.displayName = name;
  return BoldIcon;
}

export const ArrowCounterClockwiseIcon = bold(ArrowCounterClockwiseBase, "ArrowCounterClockwiseIcon");
export const ArrowLeftIcon = bold(ArrowLeftBase, "ArrowLeftIcon");
export const ArrowRightIcon = bold(ArrowRightBase, "ArrowRightIcon");
export const ArrowUpRightIcon = bold(ArrowUpRightBase, "ArrowUpRightIcon");
export const ArrowsClockwiseIcon = bold(ArrowsClockwiseBase, "ArrowsClockwiseIcon");
export const ArrowUUpLeftIcon = bold(ArrowUUpLeftBase, "ArrowUUpLeftIcon");
export const CaretDownIcon = bold(CaretDownBase, "CaretDownIcon");
export const CaretLeftIcon = bold(CaretLeftBase, "CaretLeftIcon");
export const CaretRightIcon = bold(CaretRightBase, "CaretRightIcon");
export const CardsIcon = bold(CardsBase, "CardsIcon");
export const ChartBarIcon = bold(ChartBarBase, "ChartBarIcon");
export const CheckCircleIcon = bold(CheckCircleBase, "CheckCircleIcon");
export const CheckIcon = bold(CheckBase, "CheckIcon");
export const CircleNotchIcon = bold(CircleNotchBase, "CircleNotchIcon");
export const CopyIcon = bold(CopyBase, "CopyIcon");
export const DownloadSimpleIcon = bold(DownloadSimpleBase, "DownloadSimpleIcon");
export const HandIcon = bold(HandBase, "HandIcon");
export const HeartIcon = bold(HeartBase, "HeartIcon");
export const InfoIcon = bold(InfoBase, "InfoIcon");
export const KeyboardIcon = bold(KeyboardBase, "KeyboardIcon");
export const ListChecksIcon = bold(ListChecksBase, "ListChecksIcon");
export const ListIcon = bold(ListBase, "ListIcon");
export const MagnifyingGlassIcon = bold(MagnifyingGlassBase, "MagnifyingGlassIcon");
export const MinusIcon = bold(MinusBase, "MinusIcon");
export const NotePencilIcon = bold(NotePencilBase, "NotePencilIcon");
export const PlayIcon = bold(PlayBase, "PlayIcon");
export const PlusIcon = bold(PlusBase, "PlusIcon");
export const ShuffleIcon = bold(ShuffleBase, "ShuffleIcon");
export const SidebarSimpleIcon = bold(SidebarSimpleBase, "SidebarSimpleIcon");
export const SkipForwardIcon = bold(SkipForwardBase, "SkipForwardIcon");
export const SparkleIcon = bold(SparkleBase, "SparkleIcon");
export const StackIcon = bold(StackBase, "StackIcon");
export const StarIcon = bold(StarBase, "StarIcon");
export const SwordIcon = bold(SwordBase, "SwordIcon");
export const TrashIcon = bold(TrashBase, "TrashIcon");
export const UploadSimpleIcon = bold(UploadSimpleBase, "UploadSimpleIcon");
export const WarningIcon = bold(WarningBase, "WarningIcon");
export const XCircleIcon = bold(XCircleBase, "XCircleIcon");
export const XIcon = bold(XBase, "XIcon");

/** Code points in the Mana font (github.com/andrewgioia/mana). */
const MANA_GLYPHS = {
  tap: "",
  untap: "",
  creature: "",
  artifact: "",
  enchantment: "",
  instant: "",
  sorcery: "",
  land: "",
  planeswalker: "",
  battle: "",
  multicolor: "",
  token: "",
  counter: "",
} as const;

export type ManaGlyphName = keyof typeof MANA_GLYPHS;

/** A tap, untap or card type symbol from the Mana font. Sized by font-size, like text. */
export function ManaGlyph({ name, className, label }: { name: ManaGlyphName; className?: string; label?: string }) {
  return (
    <i
      className={cn("inline-block font-mana leading-none not-italic", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      {MANA_GLYPHS[name]}
    </i>
  );
}

/** The Commander Tinder mark: two fanned cards with a heart on the front one. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="5" y="5" width="15" height="21" rx="1.6" transform="rotate(-14 12.5 15.5)" fill="var(--ember)" opacity="0.45" />
      <rect x="11" y="5" width="15" height="21" rx="1.6" transform="rotate(8 18.5 15.5)" fill="var(--ember)" stroke="var(--ink)" strokeWidth="1.5" />
      <path
        d="M18.6 20.2c-.2 0-3.9-2.4-3.9-5 0-1.3 1-2.3 2.2-2.3.7 0 1.3.4 1.7 1 .4-.6 1-1 1.7-1 1.2 0 2.2 1 2.2 2.3 0 2.6-3.7 5-3.9 5Z"
        transform="rotate(8 18.5 15.5)"
        fill="var(--ink)"
      />
    </svg>
  );
}
