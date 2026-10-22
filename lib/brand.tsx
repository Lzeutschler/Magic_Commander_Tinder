import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** The design tokens from `app/globals.css` as hex, for generated icons and social images. */
export const BRAND_COLORS = {
  ink: "#0a0705",
  background: "#110d0b",
  surface: "#1b1613",
  ember: "#f57f3a",
  text: "#f1ebde",
  muted: "#b9b0a3",
  felt: "#0d251b",
} as const;

const HEART_PATH =
  "M18.6 20.2c-.2 0-3.9-2.4-3.9-5 0-1.3 1-2.3 2.2-2.3.7 0 1.3.4 1.7 1 .4-.6 1-1 1.7-1 1.2 0 2.2 1 2.2 2.3 0 2.6-3.7 5-3.9 5Z";

/**
 * The brand mark (two fanned cards with a heart) for `ImageResponse`: Satori only understands
 * inline styles and plain SVG. Same drawing as `BrandMark` in `components/icons.tsx`.
 */
export function BrandMarkImage({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect x="5" y="5" width="15" height="21" rx="1.6" transform="rotate(-14 12.5 15.5)" fill={BRAND_COLORS.ember} opacity="0.45" />
      <rect x="11" y="5" width="15" height="21" rx="1.6" transform="rotate(8 18.5 15.5)" fill={BRAND_COLORS.ember} stroke={BRAND_COLORS.ink} strokeWidth="1.5" />
      <path d={HEART_PATH} transform="rotate(8 18.5 15.5)" fill={BRAND_COLORS.ink} />
    </svg>
  );
}

/** Static Alegreya and Archivo files (SIL OFL) for `ImageResponse`, which cannot read variable or WOFF2 fonts. */
export async function brandFonts() {
  const load = (file: string) => readFile(join(process.cwd(), "app/fonts/og", file));
  const [alegreya, archivo, archivoSemiBold] = await Promise.all([
    load("alegreya-latin-800-normal.woff"),
    load("archivo-latin-400-normal.woff"),
    load("archivo-latin-600-normal.woff"),
  ]);
  return [
    { name: "Alegreya", data: alegreya, weight: 800 as const, style: "normal" as const },
    { name: "Archivo", data: archivo, weight: 400 as const, style: "normal" as const },
    { name: "Archivo", data: archivoSemiBold, weight: 600 as const, style: "normal" as const },
  ];
}
