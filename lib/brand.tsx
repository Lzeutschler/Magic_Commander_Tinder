/** The Lucide "flame" used in the header logo, reused for generated icons and social images. */
export const FLAME_PATH =
  "M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4";

export const BRAND_COLORS = { background: "#070b16", gold: "#e9b452", goldLight: "#f6d98f", text: "#f3efe6" } as const;

/** Flame mark for `ImageResponse` (Satori only understands inline styles and plain SVG). */
export function FlameMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d={FLAME_PATH} stroke={BRAND_COLORS.gold} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
