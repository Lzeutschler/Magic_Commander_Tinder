import type { Metadata } from "next";

import { BuildSetup } from "@/components/build/build-setup";
import { canonical } from "@/lib/metadata";

export const metadata: Metadata = { title: "Build a deck", ...canonical("/build") };

export default function BuildPage() {
  return <BuildSetup />;
}
