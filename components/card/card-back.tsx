import { BrandMark } from "@/components/icons";
import { cn } from "@/lib/utils";

/** The app's own card back (the official Magic card back is not used): an brand lattice on dark ink. */
export function CardBack({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "card-aspect overflow-hidden rounded-[4.75%] bg-ink p-[5%] shadow-lg ring-1 ring-black/60",
        className,
      )}
    >
      <div
        className="grid size-full place-items-center rounded-[3%] border border-brand/45"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #28325a 0, transparent 55%), repeating-linear-gradient(60deg, rgb(142 162 255 / 10%) 0 1px, transparent 1px 9px), repeating-linear-gradient(-60deg, rgb(142 162 255 / 10%) 0 1px, transparent 1px 9px), #141a2a",
        }}
      >
        <div className="grid aspect-square w-[46%] place-items-center rounded-full border border-brand/45 bg-ink/70">
          <BrandMark className="size-[68%]" />
        </div>
      </div>
    </div>
  );
}
