import type { CardImage } from "./types";

/**
 * Commanders that take turns rising from the brew on the home page and fan out in its preview image;
 * well known across the Commander crowd.
 */
export const SHOWCASE_COMMANDERS: { name: string; image: CardImage }[] = [
  { name: "Atraxa, Praetors' Voice", image: { key: "d/0/d0d33d52-3d28-4635-b985-51e126289259", version: "1783930136", doubleFaced: false } },
  { name: "The Ur-Dragon", image: { key: "1/0/10d42b35-844f-4a64-9981-c6118d45e826", version: "1783915607", doubleFaced: false } },
  { name: "Edgar Markov", image: { key: "a/5/a577ba08-0aa8-45be-aa83-d5078770127c", version: "1783908078", doubleFaced: false } },
];
