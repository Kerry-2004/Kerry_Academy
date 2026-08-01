"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconLoader2,
  IconStarFilled,
  IconX,
} from "@tabler/icons-react";
import { submitQuiz, type QuizQuestion, type QuizResult, type QuizSubmission } from "@/lib/api";

type Phase = "intro" | "playing" | "results";

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function QuizPlayer({
  slug,
  lessonId,
  questions,
  accessToken,
  previousResult,
  onFinished,
}: {
  slug: string;
  lessonId: number;
  questions: QuizQuestion[];
  accessToken: string;
  previousResult: QuizResult | null;
  onFinished: () => void;
}) {
  const [phase, setPhase] = useState<Phase>(previousResult ? "results" : "intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [error, setError] = useState(false);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (phase !== "playing") return;
    startRef.current = Date.now();
    setElapsed(0);
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const total = questions.length;
  const answeredCount = Object.keys(answers).length;
  const question = questions[current];
  const progressPercent = total > 0 ? ((current + 1) / total) * 100 : 0;

  const resultByQuestion = useMemo(() => {
    const map = new Map<number, QuizSubmission["results"][number]>();
    submission?.results.forEach((r) => map.set(r.question_id, r));
    return map;
  }, [submission]);

  const startQuiz = () => {
    setAnswers({});
    setCurrent(0);
    setSubmission(null);
    setError(false);
    setPhase("playing");
  };

  const selectAnswer = (questionId: number, answerId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const finish = async () => {
    setSubmitting(true);
    setError(false);
    try {
      const result = await submitQuiz(slug, lessonId, answers, accessToken);
      setSubmission(result);
      setPhase("results");
      onFinished();
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Écran d'intro ----
  if (phase === "intro") {
    return (
      <div className="rounded-2xl border border-gold-border/40 bg-[#141414] p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-dim text-gold">
          <IconStarFilled className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-syne text-xl font-bold text-white">Quiz</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {total} question{total > 1 ? "s" : ""} · une seule réponse par question.
        </p>
        <button onClick={startQuiz} className="btn-primary mx-auto mt-6">
          Commencer le quiz →
        </button>
      </div>
    );
  }

  // ---- Écran de résultats ----
  if (phase === "results") {
    const score = submission?.score ?? previousResult?.score ?? 0;
    const maxScore = submission?.max_score ?? previousResult?.max_score ?? total;
    const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passed = percent >= 50;

    return (
      <div>
        <div className="rounded-2xl border border-gold-border/40 bg-[#141414] p-8 text-center">
          <span
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              passed ? "bg-gold-dim text-gold" : "bg-white/5 text-muted-foreground"
            }`}
          >
            {passed ? <IconCheck className="h-8 w-8" /> : <IconX className="h-8 w-8" />}
          </span>
          <h2 className="mt-4 font-syne text-2xl font-bold text-white">
            {score} / {maxScore}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {passed ? "Bravo, quiz réussi !" : "Continuez, vous y êtes presque."} ({percent}%)
          </p>
          <button onClick={startQuiz} className="btn-secondary mx-auto mt-6">
            Recommencer le quiz
          </button>
        </div>

        {submission && (
          <div className="mt-5 flex flex-col gap-4">
            {questions.map((q, index) => {
              const r = resultByQuestion.get(q.id);
              return (
                <div key={q.id} className="rounded-2xl bg-[#141414] p-5">
                  <div className="flex items-start gap-2">
                    {r?.is_correct ? (
                      <IconCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    ) : (
                      <IconX className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                    )}
                    <p className="font-syne font-semibold text-white">
                      {index + 1}. {q.text}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 pl-7">
                    {q.answers.map((a) => {
                      const isSelected = r?.selected_answer_id === a.id;
                      const isCorrect = r?.correct_answer_id === a.id;
                      return (
                        <div
                          key={a.id}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                            isCorrect
                              ? "border-gold/50 bg-gold-dim text-white"
                              : isSelected
                                ? "border-red-500/50 bg-red-500/10 text-white"
                                : "border-white/10 text-muted-foreground"
                          }`}
                        >
                          <span>{a.text}</span>
                          {isCorrect && <span className="text-xs text-gold">Bonne réponse</span>}
                          {isSelected && !isCorrect && (
                            <span className="text-xs text-red-400">Votre réponse</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ---- Écran de jeu (une question à la fois) ----
  const selectedForCurrent = answers[question.id];
  const isLast = current === total - 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#141414]">
      {/* Barre de progression + minuteur */}
      <div className="flex items-center gap-4 border-b border-white/5 px-5 py-4">
        <span className="text-sm font-semibold text-white">
          {current + 1}/{total}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <IconClock className="h-4 w-4" />
          {formatTime(elapsed)}
        </span>
        <button
          onClick={finish}
          disabled={submitting}
          className="text-sm font-semibold text-white underline-offset-4 transition hover:text-gold hover:underline"
        >
          Terminer
        </button>
      </div>

      {/* Question */}
      <div className="px-6 py-8">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconStarFilled className="h-4 w-4 text-gold" />
          Question {current + 1}
        </p>
        <h3 className="mt-2 font-syne text-xl font-bold text-white">{question.text}</h3>

        <div className="mt-6 flex flex-col gap-3">
          {question.answers.map((answer) => {
            const isSelected = selectedForCurrent === answer.id;
            return (
              <button
                key={answer.id}
                onClick={() => selectAnswer(question.id, answer.id)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                  isSelected
                    ? "border-gold bg-gold-dim"
                    : "border-white/10 hover:border-white/25 hover:bg-white/[0.03]"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? "border-gold" : "border-white/30"
                  }`}
                >
                  {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-gold" />}
                </span>
                <span className="font-medium text-white">{answer.text}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400">
            Impossible d&apos;enregistrer le quiz. Réessayez.
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-white/5 px-5 py-4">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-white disabled:opacity-40"
        >
          <IconArrowLeft className="h-4 w-4" />
          Précédent
        </button>

        <span className="text-xs text-muted-foreground">
          {answeredCount}/{total} répondu{answeredCount > 1 ? "es" : "e"}
        </span>

        {isLast ? (
          <button onClick={finish} disabled={submitting} className="btn-primary">
            {submitting ? <IconLoader2 className="h-4 w-4 animate-spin" /> : "Terminer le quiz →"}
          </button>
        ) : (
          <button
            onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
            className="btn-primary"
          >
            Suivant
            <IconArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
