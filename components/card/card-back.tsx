import { BrandMark } from "@/components/icons";
import { cn } from "@/lib/utils";

/** The app's own card back (the official Magic card back is not used): an ember lattice on dark ink. */
export function CardBack({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "card-aspect overflow-hidden rounded-[4.75%] bg-ink p-[5%] shadow-lg ring-1 ring-black/60",
        className,
      )}
    >
      <div
        className="grid size-full place-items-center rounded-[3%] border border-ember/45"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, oklch(0.3 0.06 45) 0, transparent 55%), repeating-linear-gradient(60deg, oklch(0.72 0.165 48 / 9%) 0 1px, transparent 1px 9px), repeating-linear-gradient(-60deg, oklch(0.72 0.165 48 / 9%) 0 1px, transparent 1px 9px), oklch(0.19 0.02 45)",
        }}
      >
        <div className="grid aspect-square w-[46%] place-items-center rounded-full border border-ember/45 bg-ink/70">
          <BrandMark className="size-[68%]" />
        </div>
      </div>
    </div>
  );
}
