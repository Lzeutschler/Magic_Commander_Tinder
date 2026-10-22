import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { BrandMarkSvg } from "./brand-mark";

/** The design tokens from `app/globals.css` as hex, for generated icons and social images. */
export const BRAND_COLORS = {
  ink: "#0b0e13",
  background: "#11141a",
  surface: "#1a1f28",
  brand: "#8ea2ff",
  brandLight: "#a6b6ff",
  brandEdge: "#4553a8",
  heart: "#f28fb8",
  text: "#e8ecf3",
  muted: "#a3acba",
} as const;

/** The brand mark for `ImageResponse`, which needs plain colours instead of CSS variables. */
export function BrandMarkImage({ size }: { size: number }) {
  return (
    <BrandMarkSvg
      size={size}
      colors={{ brew: BRAND_COLORS.brand, rim: BRAND_COLORS.brandLight, legs: BRAND_COLORS.brandEdge, heart: BRAND_COLORS.heart }}
    />
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
