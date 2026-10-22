import type { Metadata } from "next";

import { BuildSetup } from "@/components/build/build-setup";

export const metadata: Metadata = { title: "Build a deck" };

export default function BuildPage() {
  return <BuildSetup />;
}
