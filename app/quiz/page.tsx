import type { Metadata } from "next";

import { QuizScreen } from "@/components/quiz/quiz-screen";
import { canonical } from "@/lib/metadata";

export const metadata: Metadata = { title: "Find your commander", ...canonical("/quiz") };

export default function QuizPage() {
  return <QuizScreen />;
}
