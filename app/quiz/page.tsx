import type { Metadata } from "next";

import { QuizScreen } from "@/components/quiz/quiz-screen";

export const metadata: Metadata = { title: "Find your commander" };

export default function QuizPage() {
  return <QuizScreen />;
}
